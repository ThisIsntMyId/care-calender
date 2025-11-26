import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  tasks,
  appointments,
  doctors,
  categories,
  doctorCategoryAssignments,
  doctorBusinessHours,
  doctorTimeOff,
} from '@/db/schema';
import { eq, and, sql, inArray, gte, or, desc } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// --- Types ---

interface RescheduleRequest {
  taskId: number;
  slotStart: string; // ISO String
  timezone: string; // Patient's timezone
}

interface DoctorWithScheduleAndTimeOff {
  id: number;
  name: string;
  email: string;
  status: string;
  timezone: string;
  schedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
  }>;
  timeOffs: Array<{
    startDateTime: Date;
    endDateTime: Date;
  }>;
}

// --- Helper Functions ---

async function getCategoryById(categoryId: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId));
  return category;
}

async function getDoctorsWithScheduleAndTimeOff(
  categoryId: number
): Promise<DoctorWithScheduleAndTimeOff[]> {
  const doctorAssignments = await db
    .select({
      doctorId: doctorCategoryAssignments.doctorId,
      doctor: {
        id: doctors.id,
        name: doctors.name,
        email: doctors.email,
        status: doctors.status,
        timezone: doctors.timezone,
      },
    })
    .from(doctorCategoryAssignments)
    .innerJoin(doctors, eq(doctorCategoryAssignments.doctorId, doctors.id))
    .where(
      and(
        eq(doctorCategoryAssignments.categoryId, categoryId),
        eq(doctors.status, 'active')
      )
    );

  if (doctorAssignments.length === 0) return [];

  const doctorIds = doctorAssignments.map((da) => da.doctorId);
  const now = dayjs().toDate();

  const [allSchedules, allTimeOffs] = await Promise.all([
    db
      .select()
      .from(doctorBusinessHours)
      .where(inArray(doctorBusinessHours.doctorId, doctorIds)),
    db
      .select({
        doctorId: doctorTimeOff.doctorId,
        startDateTime: doctorTimeOff.startDateTime,
        endDateTime: doctorTimeOff.endDateTime,
      })
      .from(doctorTimeOff)
      .where(
        and(
          inArray(doctorTimeOff.doctorId, doctorIds),
          gte(doctorTimeOff.endDateTime, now)
        )
      ),
  ]);

  const schedulesByDoctor: Record<number, typeof allSchedules> = {};
  allSchedules.forEach((s) => {
    if (!schedulesByDoctor[s.doctorId]) schedulesByDoctor[s.doctorId] = [];
    schedulesByDoctor[s.doctorId].push(s);
  });

  const timeOffsByDoctor: Record<number, Array<{ startDateTime: Date; endDateTime: Date }>> = {};
  allTimeOffs.forEach((t) => {
    if (!timeOffsByDoctor[t.doctorId]) timeOffsByDoctor[t.doctorId] = [];
    timeOffsByDoctor[t.doctorId].push({
      startDateTime: new Date(t.startDateTime),
      endDateTime: new Date(t.endDateTime),
    });
  });

  return doctorAssignments.map((assignment) => ({
    id: assignment.doctor.id,
    name: assignment.doctor.name,
    email: assignment.doctor.email,
    status: assignment.doctor.status,
    timezone: assignment.doctor.timezone,
    schedule: (schedulesByDoctor[assignment.doctorId] || []).map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      isEnabled: s.isEnabled,
    })),
    timeOffs: (timeOffsByDoctor[assignment.doctorId] || []).map((t) => ({
      startDateTime: new Date(t.startDateTime),
      endDateTime: new Date(t.endDateTime),
    })),
  }));
}

function isDoctorWorking(
  doctor: DoctorWithScheduleAndTimeOff,
  slotStartUtc: dayjs.Dayjs,
  slotEndUtc: dayjs.Dayjs
): boolean {
  const docTz = doctor.timezone;
  const startInDocTz = slotStartUtc.tz(docTz);
  const endInDocTz = slotEndUtc.tz(docTz);

  const dayOfWeek = startInDocTz.day();
  const shift = doctor.schedule.find((s) => s.dayOfWeek === dayOfWeek && s.isEnabled);

  if (!shift) return false;

  const [sH, sM] = shift.startTime.split(':').map(Number);
  const [eH, eM] = shift.endTime.split(':').map(Number);

  const shiftStart = startInDocTz.hour(sH).minute(sM).second(0).millisecond(0);
  let shiftEnd = startInDocTz.hour(eH).minute(eM).second(0).millisecond(0);

  if (shiftEnd.isBefore(shiftStart)) {
    shiftEnd = shiftEnd.add(1, 'day');
  }

  const isWithinShift =
    (startInDocTz.isSame(shiftStart) || startInDocTz.isAfter(shiftStart)) &&
    (endInDocTz.isSame(shiftEnd) || endInDocTz.isBefore(shiftEnd));

  if (!isWithinShift) return false;

  const hasOff = doctor.timeOffs.some((off) => {
    const offStart = dayjs(off.startDateTime);
    const offEnd = dayjs(off.endDateTime);
    return slotStartUtc.isBefore(offEnd) && slotEndUtc.isAfter(offStart);
  });

  return !hasOff;
}

function prioritizeDoctors(
  candidateDoctors: DoctorWithScheduleAndTimeOff[],
  categoryId: number
): DoctorWithScheduleAndTimeOff[] {
  return candidateDoctors.sort(() => Math.random() - 0.5);
}

// --- Main API Route ---

const COOKIE_NAME = 'patient_auth';

export async function PUT(req: NextRequest) {
  try {
    // Authentication check
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);

    const body: RescheduleRequest = await req.json();
    const { taskId, slotStart, timezone: patientTz } = body;

    // 1. Validation & Setup
    if (!taskId || !slotStart || !patientTz) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get task and verify ownership
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.patientId, authData.id)));

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify task can be rescheduled (must be scheduled or confirmed)
    if (task.status !== 'scheduled' && task.status !== 'pending') {
      return NextResponse.json(
        { error: 'Appointment cannot be rescheduled. Current status: ' + task.status },
        { status: 400 }
      );
    }

    // Get existing appointment (most recent active one)
    const [existingAppointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.taskId, taskId),
          or(
            eq(appointments.status, 'scheduled'),
            eq(appointments.status, 'confirmed')
          )
        )
      )
      .orderBy(desc(appointments.createdAt))
      .limit(1);

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'No active appointment found to reschedule' },
        { status: 404 }
      );
    }

    // Get category
    const category = await getCategoryById(task.categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Parse slot times
    const requestedStart = dayjs(slotStart).utc();
    if (!requestedStart.isValid()) {
      return NextResponse.json({ error: 'Invalid slot start time' }, { status: 400 });
    }

    const requestedEnd = requestedStart.add(category.durationMinutes, 'minute');

    // 2. Fetch ALL Eligible Doctors for this Category
    const allDoctors = await getDoctorsWithScheduleAndTimeOff(task.categoryId);

    if (allDoctors.length === 0) {
      return NextResponse.json({ error: 'No doctors available for this category' }, { status: 404 });
    }

    // 3. Filter: Who is actually working this slot?
    const availableDoctors = allDoctors.filter((doc) =>
      isDoctorWorking(doc, requestedStart, requestedEnd)
    );

    if (availableDoctors.length === 0) {
      return NextResponse.json(
        { error: 'No doctors available for this time slot' },
        { status: 404 }
      );
    }

    // 4. Sort: Prioritize doctors (prefer current doctor if available)
    const currentDoctor = availableDoctors.find((d) => d.id === existingAppointment.doctorId);
    const sortedDoctors = currentDoctor
      ? [currentDoctor, ...availableDoctors.filter((d) => d.id !== currentDoctor.id)]
      : prioritizeDoctors(availableDoctors, task.categoryId);

    // 5. THE ATOMIC RESCHEDULING LOOP
    let rescheduledAppointment = null;

    for (const doc of sortedDoctors) {
      try {
        rescheduledAppointment = await db.transaction(async (tx) => {
          // A. ACQUIRE ADVISORY LOCK
          const lockKey = `doc_${doc.id}_${requestedStart.toISOString()}`;
          await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

          // B. CHECK CAPACITY (exclude current appointment from count)
          const allDoctorAppointments = await tx
            .select({
              id: appointments.id,
              startAt: appointments.startAt,
              endAt: appointments.endAt,
              status: appointments.status,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.doctorId, doc.id),
                or(
                  eq(appointments.status, 'scheduled'),
                  eq(appointments.status, 'confirmed')
                )
              )
            );

          // Check overlaps, excluding the appointment being rescheduled
          const overlappingCount = allDoctorAppointments
            .filter((apt) => apt.id !== existingAppointment.id)
            .filter((apt) => {
              const aptStart = dayjs(apt.startAt);
              const aptEnd = dayjs(apt.endAt);
              return requestedStart.isBefore(aptEnd) && requestedEnd.isAfter(aptStart);
            }).length;

          const limit = category.concurrency || 1;
          if (overlappingCount >= limit) {
            throw new Error('TRY_NEXT_DOC');
          }

          // C. UPDATE APPOINTMENT
          const [updatedApp] = await tx
            .update(appointments)
            .set({
              doctorId: doc.id,
              startAt: requestedStart.toDate(),
              endAt: requestedEnd.toDate(),
              status: 'scheduled', // Reset to scheduled when rescheduled
              updatedAt: new Date(),
            })
            .where(eq(appointments.id, existingAppointment.id))
            .returning();

          // D. UPDATE TASK
          await tx
            .update(tasks)
            .set({
              doctorId: doc.id,
              status: 'scheduled', // Ensure status is scheduled
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId));

          return updatedApp;
        });

        // Success!
        break;
      } catch (e: any) {
        if (e.message === 'TRY_NEXT_DOC') {
          continue;
        }
        throw e;
      }
    }

    // 6. Final Result
    if (!rescheduledAppointment) {
      return NextResponse.json(
        {
          error: 'Slot fully booked across all doctors. Please choose another time.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: rescheduledAppointment,
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

