import { db } from '@/db';
import { appointments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Get the most recent appointment for a task
 */
export async function getTaskAppointment(taskId: number) {
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.taskId, taskId))
    .orderBy(desc(appointments.createdAt))
    .limit(1);
  return appointment;
}

/**
 * Get all appointments for a task
 */
export async function getTaskAppointments(taskId: number) {
  return await db
    .select()
    .from(appointments)
    .where(eq(appointments.taskId, taskId))
    .orderBy(desc(appointments.createdAt));
}

/**
 * Create appointment for a task
 */
export async function createAppointment(data: {
  taskId: number;
  patientId: number;
  doctorId: number | null;
  categoryId: number;
  startAt: Date;
  endAt: Date;
  status?: string;
  link?: string;
}) {
  const [appointment] = await db
    .insert(appointments)
    .values({
      taskId: data.taskId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      categoryId: data.categoryId,
      startAt: data.startAt,
      endAt: data.endAt,
      status: data.status || 'scheduled',
      link: data.link,
      updatedAt: new Date(),
    })
    .returning();
  return appointment;
}
