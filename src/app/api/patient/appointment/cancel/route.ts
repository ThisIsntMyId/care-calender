import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, appointments } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

const COOKIE_NAME = 'patient_auth';

export async function PUT(req: NextRequest) {
  try {
    // Authentication check
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);

    const body = await req.json();
    const { taskId } = body;

    // Validation
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get task and verify ownership
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.patientId, authData.id)));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify task can be cancelled (must be scheduled or confirmed)
    if (task.status !== 'scheduled' && task.status !== 'pending') {
      return NextResponse.json(
        { error: 'Appointment cannot be cancelled. Current status: ' + task.status },
        { status: 400 }
      );
    }

    // Get existing appointment (most recent active one)
    const [existingAppointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.taskId, taskId),
          or(
            eq(appointments.status, 'scheduled'),
            eq(appointments.status, 'confirmed')
          )
        )
      )
      .orderBy(desc(appointments.createdAt))
      .limit(1);

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'No active appointment found to cancel' },
        { status: 404 }
      );
    }

    // Cancel in transaction
    await db.transaction(async (tx) => {
      // Update appointment status to cancelled
      await tx
        .update(appointments)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, existingAppointment.id));

      // Update task status to cancelled
      await tx
        .update(tasks)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));
    });

    return NextResponse.json({
      status: 'success',
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

