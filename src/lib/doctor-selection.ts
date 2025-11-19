import { db } from '@/db';
import { doctorCategoryAssignments, doctors, tasks } from '@/db/schema';
import { eq, and, desc, asc, sql, notInArray } from 'drizzle-orm';

export type SelectionAlgorithm = 'priority' | 'weighted' | 'random' | 'least_recently_used' | 'round_robin';

interface DoctorWithAssignment {
  id: number;
  name: string;
  email: string;
  isOnline: boolean;
  status: string;
  priority?: number;
  weight?: number;
  lastAssignedAt?: Date | null;
  roundRobinIndex?: number;
}

/**
 * Select a doctor for a category based on the configured algorithm
 */
export async function selectDoctorForCategory(
  categoryId: number,
  algorithm: SelectionAlgorithm,
  excludeDoctorIds: number[] = []
): Promise<number | null> {
  // Get all active doctors assigned to this category
  const assignments = await db
    .select({
      doctorId: doctorCategoryAssignments.doctorId,
      priority: doctorCategoryAssignments.priority,
      weight: doctorCategoryAssignments.weight,
      lastAssignedAt: doctorCategoryAssignments.lastAssignedAt,
      roundRobinIndex: doctorCategoryAssignments.roundRobinIndex,
      doctor: {
        id: doctors.id,
        name: doctors.name,
        email: doctors.email,
        isOnline: doctors.isOnline,
        status: doctors.status,
      },
    })
    .from(doctorCategoryAssignments)
    .innerJoin(doctors, eq(doctorCategoryAssignments.doctorId, doctors.id))
    .where(
      and(
        eq(doctorCategoryAssignments.categoryId, categoryId),
        eq(doctors.status, 'active'),
        ...(excludeDoctorIds.length > 0 ? [notInArray(doctors.id, excludeDoctorIds)] : [])
      )
    );

  if (assignments.length === 0) {
    return null;
  }

  // Filter to only online doctors if available, otherwise use all active
  const availableDoctors = assignments.filter((a) => a.doctor.isOnline);
  const candidates = availableDoctors.length > 0 ? availableDoctors : assignments;

  if (candidates.length === 0) {
    return null;
  }

  let selectedDoctorId: number | null = null;

  switch (algorithm) {
    case 'priority':
      // Select doctor with lowest priority number (highest priority)
      const prioritySorted = [...candidates].sort((a, b) => a.priority - b.priority);
      selectedDoctorId = prioritySorted[0].doctorId;
      break;

    case 'weighted':
      // Weighted random selection based on weight values
      const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
      if (totalWeight === 0) {
        // If all weights are 0, fall back to random
        selectedDoctorId = candidates[Math.floor(Math.random() * candidates.length)].doctorId;
      } else {
        let random = Math.random() * totalWeight;
        for (const candidate of candidates) {
          random -= candidate.weight;
          if (random <= 0) {
            selectedDoctorId = candidate.doctorId;
            break;
          }
        }
      }
      break;

    case 'random':
      // Random selection
      selectedDoctorId = candidates[Math.floor(Math.random() * candidates.length)].doctorId;
      break;

    case 'least_recently_used':
      // Select doctor with oldest or null lastAssignedAt
      const lruSorted = [...candidates].sort((a, b) => {
        if (!a.lastAssignedAt && !b.lastAssignedAt) return 0;
        if (!a.lastAssignedAt) return -1;
        if (!b.lastAssignedAt) return 1;
        return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
      });
      selectedDoctorId = lruSorted[0].doctorId;
      // Update lastAssignedAt
      if (selectedDoctorId) {
        await db
          .update(doctorCategoryAssignments)
          .set({
            lastAssignedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(doctorCategoryAssignments.doctorId, selectedDoctorId),
              eq(doctorCategoryAssignments.categoryId, categoryId)
            )
          );
      }
      break;

    case 'round_robin':
      // Select doctor with lowest roundRobinIndex, then increment all
      const rrSorted = [...candidates].sort((a, b) => a.roundRobinIndex - b.roundRobinIndex);
      selectedDoctorId = rrSorted[0].doctorId;
      // Increment round robin index for selected doctor, reset others to 0
      if (selectedDoctorId) {
        await db
          .update(doctorCategoryAssignments)
          .set({
            roundRobinIndex: sql`${doctorCategoryAssignments.roundRobinIndex} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(doctorCategoryAssignments.doctorId, selectedDoctorId),
              eq(doctorCategoryAssignments.categoryId, categoryId)
            )
          );
        // Reset other doctors' indices to 0 if they exceed a threshold
        // This prevents overflow and allows cycling
        const maxIndex = Math.max(...candidates.map((c) => c.roundRobinIndex));
        if (maxIndex > 1000) {
        await db
          .update(doctorCategoryAssignments)
          .set({
            roundRobinIndex: 0,
            updatedAt: new Date(),
          })
          .where(eq(doctorCategoryAssignments.categoryId, categoryId));
        }
      }
      break;

    default:
      // Default to round robin
      selectedDoctorId = candidates[0].doctorId;
  }

  return selectedDoctorId;
}

