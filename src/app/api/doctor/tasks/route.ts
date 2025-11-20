import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories, patients } from '@/db/schema';
import { eq, and, gte, lte, desc, or, isNull, isNotNull, asc } from 'drizzle-orm';

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
    const filter = searchParams.get('filter'); // 'today' | 'scheduled' | 'unscheduled'
    const sortBy = searchParams.get('sortBy'); // 'appointment' | 'created' (for scheduled tab)

    // Build where conditions
    const whereConditions: any[] = [eq(tasks.doctorId, authData.id)];

    // Apply filter based on mode
    if (filter === 'today') {
      // Tasks scheduled for today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      whereConditions.push(
        and(
          isNotNull(tasks.appointmentStartAt),
          gte(tasks.appointmentStartAt, startOfDay),
          lte(tasks.appointmentStartAt, endOfDay)
        )
      );
    } else if (filter === 'scheduled') {
      // All tasks with appointments scheduled
      whereConditions.push(isNotNull(tasks.appointmentStartAt));
    } else if (filter === 'unscheduled') {
      // Tasks without appointments scheduled
      whereConditions.push(isNull(tasks.appointmentStartAt));
    }

    // Determine ordering
    let orderBy;
    if (filter === 'scheduled' && sortBy === 'appointment') {
      // Sort by appointment time (earliest first)
      orderBy = asc(tasks.appointmentStartAt);
    } else {
      // Default: sort by created at (latest first)
      orderBy = desc(tasks.createdAt);
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
        createdAt: tasks.createdAt,
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
      .orderBy(orderBy);

    return NextResponse.json(doctorTasks);
  } catch (error) {
    console.error('Get doctor tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

