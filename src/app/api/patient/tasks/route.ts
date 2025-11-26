import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories, doctors, patients, appointments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const COOKIE_NAME = 'patient_auth';

// GET - Get all tasks for the authenticated patient
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);

    // Get all tasks for this patient with category, doctor, and appointment info
    const patientTasks = await db
      .select({
        id: tasks.id,
        categoryId: tasks.categoryId,
        doctorId: tasks.doctorId,
        status: tasks.status,
        paymentStatus: tasks.paymentStatus,
        appointment: {
          id: appointments.id,
          startAt: appointments.startAt,
          endAt: appointments.endAt,
          status: appointments.status,
        },
        category: {
          id: categories.id,
          name: categories.name,
          price: categories.price,
          durationMinutes: categories.durationMinutes,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
        },
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(doctors, eq(tasks.doctorId, doctors.id))
      .leftJoin(appointments, eq(tasks.id, appointments.taskId))
      .where(eq(tasks.patientId, authData.id))
      .orderBy(desc(tasks.createdAt));

    return NextResponse.json(patientTasks);
  } catch (error) {
    console.error('Get patient tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new task for logged-in patient
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { categoryId } = await req.json();

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Create new task
    const [newTask] = await db
      .insert(tasks)
      .values({
        patientId: authData.id,
        categoryId: categoryId,
        status: 'pending',
        paymentStatus: 'unpaid',
        tag: 'appointment',
      })
      .returning();

    return NextResponse.json({ taskId: newTask.id }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
