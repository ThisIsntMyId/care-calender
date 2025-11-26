import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, patients, doctors, categories, appointments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// GET - Get all tasks
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const allTasks = await db
      .select({
        id: tasks.id,
        patientId: tasks.patientId,
        doctorId: tasks.doctorId,
        categoryId: tasks.categoryId,
        type: tasks.type,
        tag: tasks.tag,
        status: tasks.status,
        paymentStatus: tasks.paymentStatus,
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
      .orderBy(desc(tasks.createdAt));

    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

