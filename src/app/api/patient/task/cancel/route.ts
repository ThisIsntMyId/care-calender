import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, appointments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTaskAppointment } from '@/lib/appointments';

const COOKIE_NAME = 'patient_auth';

export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Update appointment status to cancelled
    const appointment = await getTaskAppointment(taskId);
    if (appointment) {
      await db
        .update(appointments)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointment.id));
    }

    // Update task status to cancelled
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.patientId, authData.id)
        )
      )
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Cancel task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

