import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, patients, doctors, categories, appointments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTaskAppointment, createAppointment } from '@/lib/appointments';

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
        reservedUntil: tasks.reservedUntil,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        appointment: {
          id: appointments.id,
          startAt: appointments.startAt,
          endAt: appointments.endAt,
          status: appointments.status,
          link: appointments.link,
        },
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
      .leftJoin(appointments, eq(tasks.id, appointments.taskId))
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

    // Get task first to check if it exists
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      doctorId,
      status,
      paymentStatus,
      appointmentStatus,
      appointmentStartAt,
      appointmentEndAt,
      appointmentLink,
    } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (doctorId !== undefined) {
      updateData.doctorId = doctorId === null || doctorId === '' ? null : parseInt(doctorId);
    }
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    // Update or create appointment
    const existingAppointment = await getTaskAppointment(taskId);
    
    if (appointmentStartAt && appointmentEndAt) {
      if (existingAppointment) {
        // Update existing appointment
        await db
          .update(appointments)
          .set({
            startAt: new Date(appointmentStartAt),
            endAt: new Date(appointmentEndAt),
            status: appointmentStatus || existingAppointment.status,
            link: appointmentLink !== undefined ? appointmentLink : existingAppointment.link,
            doctorId: updateData.doctorId !== undefined ? updateData.doctorId : existingAppointment.doctorId,
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, existingAppointment.id));
      } else {
        // Create new appointment
        await createAppointment({
          taskId: taskId,
          patientId: task.patientId,
          doctorId: updateData.doctorId !== undefined ? updateData.doctorId : task.doctorId,
          categoryId: task.categoryId,
          startAt: new Date(appointmentStartAt),
          endAt: new Date(appointmentEndAt),
          status: appointmentStatus || 'scheduled',
          link: appointmentLink,
        });
      }
    } else if (existingAppointment && appointmentStatus !== undefined) {
      // Update appointment status only
      await db
        .update(appointments)
        .set({
          status: appointmentStatus,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, existingAppointment.id));
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

