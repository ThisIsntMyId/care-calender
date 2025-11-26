import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  tasks,
  appointments,
  doctors,
  categories,
  doctorCategoryAssignments,
  doctorBusinessHours,
  doctorTimeOff,
} from '@/db/schema';
import { eq, and, sql, inArray, gte, lte, or } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// --- Types ---

interface BookingRequest {
  taskId: number;
  slotStart: string; // ISO String
  timezone: string; // Patient's timezone
}

interface DoctorWithScheduleAndTimeOff {
  id: number;
  name: string;
  email: string;
  status: string;
  timezone: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
  }>;
  timeOffs: Array<{
    startDateTime: Date;
    endDateTime: Date;
  }>;
}

// --- Helper Functions ---

/**
 * Get category details by ID
 */
async function getCategoryById(categoryId: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId));
  return category;
}

/**
 * Fetch doctors with their schedules and time offs for a category
 * Self-contained version (not importing from other files)
 */
async function getDoctorsWithScheduleAndTimeOff(
  categoryId: number
): Promise<DoctorWithScheduleAndTimeOff[]> {
  // 1. Get active doctors
  const doctorAssignments = await db
    .select({
      doctorId: doctorCategoryAssignments.doctorId,
      doctor: {
        id: doctors.id,
        name: doctors.name,
        email: doctors.email,
        status: doctors.status,
        timezone: doctors.timezone,
      },
    })
    .from(doctorCategoryAssignments)
    .innerJoin(doctors, eq(doctorCategoryAssignments.doctorId, doctors.id))
    .where(
      and(
        eq(doctorCategoryAssignments.categoryId, categoryId),
        eq(doctors.status, 'active')
      )
    );

  if (doctorAssignments.length === 0) return [];

  const doctorIds = doctorAssignments.map((da) => da.doctorId);
  const now = dayjs().toDate();

  // 2. Parallel Fetch: Schedules & Future Time Offs
  const [allSchedules, allTimeOffs] = await Promise.all([
    db
      .select()
      .from(doctorBusinessHours)
      .where(inArray(doctorBusinessHours.doctorId, doctorIds)),
    db
      .select({
        doctorId: doctorTimeOff.doctorId,
        startDateTime: doctorTimeOff.startDateTime,
        endDateTime: doctorTimeOff.endDateTime,
      })
      .from(doctorTimeOff)
      .where(
        and(
          inArray(doctorTimeOff.doctorId, doctorIds),
          gte(doctorTimeOff.endDateTime, now)
        )
      ),
  ]);

  // 3. Grouping
  const schedulesByDoctor: Record<number, typeof allSchedules> = {};
  allSchedules.forEach((s) => {
    if (!schedulesByDoctor[s.doctorId]) schedulesByDoctor[s.doctorId] = [];
    schedulesByDoctor[s.doctorId].push(s);
  });

  const timeOffsByDoctor: Record<number, Array<{ startDateTime: Date; endDateTime: Date }>> = {};
  allTimeOffs.forEach((t) => {
    if (!timeOffsByDoctor[t.doctorId]) timeOffsByDoctor[t.doctorId] = [];
    timeOffsByDoctor[t.doctorId].push({
      startDateTime: new Date(t.startDateTime),
      endDateTime: new Date(t.endDateTime),
    });
  });

  return doctorAssignments.map((assignment) => ({
    id: assignment.doctor.id,
    name: assignment.doctor.name,
    email: assignment.doctor.email,
    status: assignment.doctor.status,
    timezone: assignment.doctor.timezone,
    schedule: (schedulesByDoctor[assignment.doctorId] || []).map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isEnabled: s.isEnabled,
    })),
    timeOffs: (timeOffsByDoctor[assignment.doctorId] || []).map((t) => ({
      startDateTime: new Date(t.startDateTime),
      endDateTime: new Date(t.endDateTime),
    })),
  }));
}

/**
 * Check if doctor is working at this specific time slot
 */
function isDoctorWorking(
  doctor: DoctorWithScheduleAndTimeOff,
  slotStartUtc: dayjs.Dayjs,
  slotEndUtc: dayjs.Dayjs
): boolean {
  const docTz = doctor.timezone;
  const startInDocTz = slotStartUtc.tz(docTz);
  const endInDocTz = slotEndUtc.tz(docTz);

  // 1. Check Shift
  const dayOfWeek = startInDocTz.day();
  const shift = doctor.schedule.find((s) => s.dayOfWeek === dayOfWeek && s.isEnabled);

  if (!shift) return false;

  const [sH, sM] = shift.startTime.split(':').map(Number);
  const [eH, eM] = shift.endTime.split(':').map(Number);

  const shiftStart = startInDocTz.hour(sH).minute(sM).second(0).millisecond(0);
  let shiftEnd = startInDocTz.hour(eH).minute(eM).second(0).millisecond(0);

  // Handle Night Shift: If End < Start (e.g., 22:00 - 06:00), add 1 day to End
  if (shiftEnd.isBefore(shiftStart)) {
    shiftEnd = shiftEnd.add(1, 'day');
  }

  const isWithinShift =
    (startInDocTz.isSame(shiftStart) || startInDocTz.isAfter(shiftStart)) &&
    (endInDocTz.isSame(shiftEnd) || endInDocTz.isBefore(shiftEnd));

  if (!isWithinShift) return false;

  // 2. Check Time Off
  const hasOff = doctor.timeOffs.some((off) => {
    const offStart = dayjs(off.startDateTime);
    const offEnd = dayjs(off.endDateTime);
    return slotStartUtc.isBefore(offEnd) && slotEndUtc.isAfter(offStart);
  });

  return !hasOff;
}

/**
 * Prioritize doctors - simple random shuffle to distribute load
 * Can be enhanced with custom logic (least busy, highest rated, round robin, etc.)
 */
function prioritizeDoctors(
  candidateDoctors: DoctorWithScheduleAndTimeOff[],
  categoryId: number
): DoctorWithScheduleAndTimeOff[] {
  // Simple implementation: Random shuffle to distribute load
  // OR: Could query appointment counts here to sort by "least busy"
  return candidateDoctors.sort(() => Math.random() - 0.5);
}

// --- Main API Route ---

const COOKIE_NAME = 'patient_auth';

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);

    const body: BookingRequest = await req.json();
    const { taskId, slotStart, timezone: patientTz } = body;

    // 1. Validation & Setup
    if (!taskId || !slotStart || !patientTz) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get task and verify ownership/status
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.patientId, authData.id)));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify task is pending (not already scheduled)
    if (task.status !== 'pending') {
      return NextResponse.json(
        { error: 'Task is already scheduled or cannot be booked' },
        { status: 400 }
      );
    }

    // Get category
    const category = await getCategoryById(task.categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Parse slot times
    const requestedStart = dayjs(slotStart).utc();
    if (!requestedStart.isValid()) {
      return NextResponse.json({ error: 'Invalid slot start time' }, { status: 400 });
    }

    const requestedEnd = requestedStart.add(category.durationMinutes, 'minute');

    // 2. Fetch ALL Eligible Doctors for this Category
    const allDoctors = await getDoctorsWithScheduleAndTimeOff(task.categoryId);

    if (allDoctors.length === 0) {
      return NextResponse.json({ error: 'No doctors available for this category' }, { status: 404 });
    }

    // 3. Filter: Who is actually working this slot?
    const availableDoctors = allDoctors.filter((doc) =>
      isDoctorWorking(doc, requestedStart, requestedEnd)
    );

    if (availableDoctors.length === 0) {
      return NextResponse.json(
        { error: 'No doctors available for this time slot' },
        { status: 404 }
      );
    }

    // 4. Sort: Prioritize doctors
    const sortedDoctors = prioritizeDoctors(availableDoctors, task.categoryId);

    // 5. THE ATOMIC BOOKING LOOP
    // Use PostgreSQL advisory locks for concurrent booking protection
    let bookedAppointment = null;

    for (const doc of sortedDoctors) {
      try {
        // Use transaction for atomicity
        bookedAppointment = await db.transaction(async (tx) => {
          // A. ACQUIRE ADVISORY LOCK (blocks until available)
          // Lock key format: "doc_{doctorId}_{slotStartISO}"
          const lockKey = `doc_${doc.id}_${requestedStart.toISOString()}`;
          
          // Acquire transaction-level advisory lock (blocks until lock is available)
          // The lock is automatically released when the transaction commits or rolls back
          await tx.execute(
            sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`
          );

          // B. CHECK CAPACITY (within transaction for atomicity)
          // Fetch all appointments for this doctor and check overlaps in memory
          // This ensures we catch all overlapping appointments regardless of exact start time
          const allDoctorAppointments = await tx
            .select({
              id: appointments.id,
              startAt: appointments.startAt,
              endAt: appointments.endAt,
              status: appointments.status,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.doctorId, doc.id),
                or(
                  eq(appointments.status, 'scheduled'),
                  eq(appointments.status, 'confirmed')
                )
              )
            );

          // Check for overlapping appointments in memory (same logic as slots API)
          const overlappingCount = allDoctorAppointments.filter((apt) => {
            const aptStart = dayjs(apt.startAt);
            const aptEnd = dayjs(apt.endAt);
            // Standard overlap: StartA < EndB && EndA > StartB
            return requestedStart.isBefore(aptEnd) && requestedEnd.isAfter(aptStart);
          }).length;

          // Ensure concurrency limit
          const limit = category.concurrency || 1;
          if (overlappingCount >= limit) {
            throw new Error('TRY_NEXT_DOC'); // Capacity full, try next doctor
          }

          // B. CREATE APPOINTMENT
          const [newApp] = await tx
            .insert(appointments)
            .values({
              taskId: task.id,
              patientId: task.patientId,
              doctorId: doc.id,
              categoryId: task.categoryId,
              startAt: requestedStart.toDate(),
              endAt: requestedEnd.toDate(),
              status: 'scheduled',
              updatedAt: new Date(),
            })
            .returning();

          // C. UPDATE TASK
          await tx
            .update(tasks)
            .set({
              doctorId: doc.id,
              status: 'scheduled',
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId));

          return newApp;
        });

        // If we reach here, transaction committed successfully!
        break;
      } catch (e: any) {
        if (e.message === 'TRY_NEXT_DOC') {
          // Doctor is busy/full, try next doctor
          continue;
        }
        // Real error - rethrow
        throw e;
      }
    }

    // 6. Final Result
    if (!bookedAppointment) {
      return NextResponse.json(
        {
          error: 'Slot fully booked across all doctors. Please choose another time.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: bookedAppointment,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

