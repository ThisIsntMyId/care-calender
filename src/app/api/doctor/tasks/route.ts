import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, categories, patients, appointments } from '@/db/schema';
import { eq, and, gte, lte, desc, or, isNull, isNotNull, asc, not } from 'drizzle-orm';

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
    const filter = searchParams.get('filter'); // 'today' | 'scheduled' | 'unscheduled' | 'completed'
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
          isNotNull(appointments.startAt),
          gte(appointments.startAt, startOfDay),
          lte(appointments.startAt, endOfDay)
        )
      );
    } else if (filter === 'scheduled') {
      // All tasks with appointments scheduled (excluding completed)
      whereConditions.push(
        and(
          isNotNull(appointments.id),
          or(
            isNull(appointments.status),
            not(eq(appointments.status, 'completed'))
          )
        )
      );
    } else if (filter === 'unscheduled') {
      // Tasks without appointments scheduled
      whereConditions.push(isNull(appointments.id));
    } else if (filter === 'completed') {
      // Tasks that are completed
      whereConditions.push(eq(appointments.status, 'completed'));
    }

    // Determine ordering
    let orderBy;
    if (filter === 'scheduled' && sortBy === 'appointment') {
      // Sort by appointment time (earliest first)
      orderBy = asc(appointments.startAt);
    } else if (filter === 'completed') {
      // Sort completed tasks by completedAt (most recent first)
      orderBy = desc(tasks.completedAt);
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
        completedAt: tasks.completedAt,
        tag: tasks.tag,
        createdAt: tasks.createdAt,
        appointment: {
          id: appointments.id,
          startAt: appointments.startAt,
          endAt: appointments.endAt,
          status: appointments.status,
        },
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
      .leftJoin(appointments, eq(tasks.id, appointments.taskId))
      .where(and(...whereConditions))
      .orderBy(orderBy);

    return NextResponse.json(doctorTasks);
  } catch (error) {
    console.error('Get doctor tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

