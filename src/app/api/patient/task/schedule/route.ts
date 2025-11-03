import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const COOKIE_NAME = 'patient_auth';

export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { taskId, scheduledStartAt, scheduledEndAt } = await req.json();

    if (!taskId || !scheduledStartAt || !scheduledEndAt) {
      return NextResponse.json(
        { error: 'Task ID and schedule details are required' },
        { status: 400 }
      );
    }

    // Update task with appointment details
    const [updatedTask] = await db
      .update(tasks)
      .set({
        scheduledStartAt: new Date(scheduledStartAt),
        scheduledEndAt: new Date(scheduledEndAt),
        appointmentStatus: 'reserved',
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now
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
    console.error('Schedule task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

