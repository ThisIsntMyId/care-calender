import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories, patients } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';

// GET - Get all tasks for the authenticated doctor
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // Optional: filter by date (YYYY-MM-DD)

    // Build where conditions
    const whereConditions: any[] = [eq(tasks.doctorId, authData.id)];

    // If date is provided, filter tasks for that date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.push(
        gte(tasks.appointmentStartAt, startOfDay),
        lte(tasks.appointmentStartAt, endOfDay)
      );
    }

    const doctorTasks = await db
      .select({
        id: tasks.id,
        patientId: tasks.patientId,
        categoryId: tasks.categoryId,
        status: tasks.status,
        paymentStatus: tasks.paymentStatus,
        appointmentStartAt: tasks.appointmentStartAt,
        appointmentEndAt: tasks.appointmentEndAt,
        appointmentStatus: tasks.appointmentStatus,
        tag: tasks.tag,
        category: {
          id: categories.id,
          name: categories.name,
        },
        patient: {
          id: patients.id,
          name: patients.name,
          email: patients.email,
          phone: patients.phone,
        },
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .leftJoin(patients, eq(tasks.patientId, patients.id))
      .where(and(...whereConditions))
      .orderBy(tasks.appointmentStartAt);

    return NextResponse.json(doctorTasks);
  } catch (error) {
    console.error('Get doctor tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

