import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { selectDoctorForCategory } from '@/lib/doctor-selection';
import { createAppointment } from '@/lib/appointments';

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

    // Get task with category info
    const [task] = await db
      .select({
        id: tasks.id,
        patientId: tasks.patientId,
        categoryId: tasks.categoryId,
        doctorId: tasks.doctorId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.patientId, authData.id)
        )
      );

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get category to find selection algorithm
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, task.categoryId));

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Assign a random doctor from the category (any doctor will work)
    let doctorId = task.doctorId;
    if (!doctorId) {
      // Use 'random' algorithm to select any available doctor
      const selectedDoctorId = await selectDoctorForCategory(
        task.categoryId,
        'random' // Use random selection - any doctor will work
      );
      doctorId = selectedDoctorId;
    }

    // Create appointment record
    const appointment = await createAppointment({
      taskId: taskId,
      patientId: task.patientId,
      doctorId: doctorId,
      categoryId: task.categoryId,
      startAt: new Date(scheduledStartAt),
      endAt: new Date(scheduledEndAt),
      status: 'scheduled',
    });

    // Update task: assign doctor, set status to scheduled, and set payment timeout
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: 'scheduled', // Task status is now scheduled (appointment is scheduled)
        doctorId: doctorId, // Assign the selected doctor
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now (for payment timeout)
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

    return NextResponse.json({ success: true, task: updatedTask, appointment });
  } catch (error) {
    console.error('Schedule task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

