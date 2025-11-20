import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, patients, doctors, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// GET - Get a single task by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const task = await db
      .select({
        id: tasks.id,
        patientId: tasks.patientId,
        doctorId: tasks.doctorId,
        categoryId: tasks.categoryId,
        type: tasks.type,
        tag: tasks.tag,
        status: tasks.status,
        paymentStatus: tasks.paymentStatus,
        appointmentStartAt: tasks.appointmentStartAt,
        appointmentEndAt: tasks.appointmentEndAt,
        reservedUntil: tasks.reservedUntil,
        appointmentStatus: tasks.appointmentStatus,
        appointmentLink: tasks.appointmentLink,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        patient: {
          id: patients.id,
          name: patients.name,
          email: patients.email,
          phone: patients.phone,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          email: doctors.email,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(tasks)
      .leftJoin(patients, eq(tasks.patientId, patients.id))
      .leftJoin(doctors, eq(tasks.doctorId, doctors.id))
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task[0]);
  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a task
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      doctorId,
      status,
      paymentStatus,
      appointmentStatus,
      appointmentStartAt,
      appointmentEndAt,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (doctorId !== undefined) {
      updateData.doctorId = doctorId === null || doctorId === '' ? null : parseInt(doctorId);
    }
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (appointmentStatus !== undefined) updateData.appointmentStatus = appointmentStatus;
    if (appointmentStartAt !== undefined) {
      updateData.appointmentStartAt = appointmentStartAt ? new Date(appointmentStartAt) : null;
    }
    if (appointmentEndAt !== undefined) {
      updateData.appointmentEndAt = appointmentEndAt ? new Date(appointmentEndAt) : null;
    }

    const updated = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const deleted = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

