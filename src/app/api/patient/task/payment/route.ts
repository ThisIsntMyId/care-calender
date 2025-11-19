import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { selectDoctorForCategory } from '@/lib/doctor-selection';

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
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get task with category info
    const [task] = await db
      .select({
        id: tasks.id,
        categoryId: tasks.categoryId,
        doctorId: tasks.doctorId,
      })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.patientId, authData.id)));

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

    // Assign doctor if not already assigned
    let doctorId = task.doctorId;
    if (!doctorId) {
      const selectedDoctorId = await selectDoctorForCategory(
        task.categoryId,
        (category.selectionAlgorithm as any) || 'round_robin'
      );
      doctorId = selectedDoctorId;
    }

    // Update task payment status and assign doctor
    const [updatedTask] = await db
      .update(tasks)
      .set({
        paymentStatus: 'paid',
        appointmentStatus: 'confirmed',
        status: 'pending', // Task is now pending for doctor
        doctorId: doctorId,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.patientId, authData.id)))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Payment task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

