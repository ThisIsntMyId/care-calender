import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, doctorCategoryAssignments, doctors, doctorBusinessHours, doctorTimeOff } from '@/db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween'; // Recommended for time-off checks

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

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

type DayAvailability = {
  date: string;
  dayLabel: string;
  timezone: string;
  isAvailable: boolean;
};

/**
 * Generate day label (Today, Tomorrow, or day name)
 */
function getDayLabel(date: dayjs.Dayjs, today: dayjs.Dayjs): string {
  if (date.isSame(today, 'day')) return 'Today';
  if (date.isSame(today.add(1, 'day'), 'day')) return 'Tomorrow';
  return date.format('ddd'); // Mon, Tue, Wed, etc.
}

/**
 * Check if doctor has ENABLED working hours for this specific day of the week.
 * We don't check specific time slots here, just if the day is "open" in their settings.
 */
function hasWorkingHours(doctor: DoctorWithScheduleAndTimeOff, date: dayjs.Dayjs): boolean {
  const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday...

  // Simply find if there is an enabled schedule entry for this day
  const businessHours = doctor.schedule.find(
    (schedule) => schedule.dayOfWeek === dayOfWeek && schedule.isEnabled === true
  );

  return !!businessHours;
}

/**
 * Check if doctor has time off that overlaps with this specific date
 */
function hasTimeOff(doctor: DoctorWithScheduleAndTimeOff, date: dayjs.Dayjs): boolean {
  // Check the full 24-hour window of the date passed in
  const checkStart = date.startOf('day');
  const checkEnd = date.endOf('day');

  return doctor.timeOffs.some((timeOff) => {
    const offStart = dayjs(timeOff.startDateTime);
    const offEnd = dayjs(timeOff.endDateTime);

    // Standard Overlap Logic: (StartA < EndB) and (EndA > StartB)
    return checkStart.isBefore(offEnd) && checkEnd.isAfter(offStart);
  });
}

/**
 * Get category details by ID
 */
async function getCategoryById(categoryId: number) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId));
  
  return category;
}

/**
 * Fetch doctors with their schedules and time offs for a category
 * Uses parallel fetching to avoid N+1 query issues.
 */
async function getDoctorsWithScheduleAndTimeOff(
  categoryId: number
): Promise<DoctorWithScheduleAndTimeOff[]> {
  // 1. Get all active doctors assigned to this category
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

  if (doctorAssignments.length === 0) {
    return [];
  }

  const doctorIds = doctorAssignments.map((da) => da.doctorId);
  const now = dayjs().toDate();

  // 2. Fetch schedules and time offs in parallel
  const [allSchedules, allTimeOffs] = await Promise.all([
    // Get schedules for all doctors (single query)
    db
      .select()
      .from(doctorBusinessHours)
      .where(inArray(doctorBusinessHours.doctorId, doctorIds)),
    // Get time offs for all doctors (future and current only) - single query
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

  // 3. Group schedules by doctorId
  const schedulesByDoctor: Record<number, typeof allSchedules> = {};
  for (const schedule of allSchedules) {
    if (!schedulesByDoctor[schedule.doctorId]) {
      schedulesByDoctor[schedule.doctorId] = [];
    }
    schedulesByDoctor[schedule.doctorId].push(schedule);
  }

  // 4. Group time offs by doctorId
  const timeOffsByDoctor: Record<number, Array<{ startDateTime: Date; endDateTime: Date }>> = {};
  for (const timeOff of allTimeOffs) {
    if (!timeOffsByDoctor[timeOff.doctorId]) {
      timeOffsByDoctor[timeOff.doctorId] = [];
    }
    timeOffsByDoctor[timeOff.doctorId].push({
      startDateTime: new Date(timeOff.startDateTime),
      endDateTime: new Date(timeOff.endDateTime),
    });
  }

  // 5. Combine and return
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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const catId = searchParams.get('catId');
    const timezoneParam = searchParams.get('timezone');

    if (!catId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (!timezoneParam) {
      return NextResponse.json({ error: 'Timezone is required' }, { status: 400 });
    }

    const categoryId = parseInt(catId);
    const category = await getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const patientTz = timezoneParam;
    const nextDays = category.nextDays || 7; // Default to 7 if undefined

    // Calculate date range in PATIENT'S timezone
    const patientStartDate = dayjs().tz(patientTz).startOf('day');
    const patientEndDate = patientStartDate.add(nextDays - 1, 'day');

    // Get doctors (Optimized fetch)
    const doctorsWithScheduleAndTimeOff = await getDoctorsWithScheduleAndTimeOff(categoryId);

    if (doctorsWithScheduleAndTimeOff.length === 0) {
      return NextResponse.json({ status: 'success', data: [] });
    }

    const today = dayjs().tz(patientTz).startOf('day');
    const daysToReturn: DayAvailability[] = [];

    let currentDateCursor = patientStartDate;

    // Loop through each day required by the Patient
    while (currentDateCursor.isBefore(patientEndDate) || currentDateCursor.isSame(patientEndDate, 'day')) {
      let isAvailable = false;

      // Define the Patient's full 24-hour window
      const patientDayStart = currentDateCursor;
      const patientDayEnd = currentDateCursor.endOf('day');

      // Check every doctor to see if ANYONE can cover this day
      for (const doctor of doctorsWithScheduleAndTimeOff) {
        
        // CRITICAL: Convert Patient Start/End to Doctor's Timezone.
        // A patient's "Monday" might be "Sunday Night" or "Tuesday Morning" for the doctor.
        // We check both edges of the day to catch partial overlaps.
        const docTimeAtStart = patientDayStart.tz(doctor.timezone);
        const docTimeAtEnd = patientDayEnd.tz(doctor.timezone);

        // Check availability at the START of patient's day
        const availableAtStart = 
          hasWorkingHours(doctor, docTimeAtStart) && 
          !hasTimeOff(doctor, docTimeAtStart);

        // Check availability at the END of patient's day
        const availableAtEnd = 
          hasWorkingHours(doctor, docTimeAtEnd) && 
          !hasTimeOff(doctor, docTimeAtEnd);

        // If the doctor is working at either the start OR end of the patient's day, 
        // we consider the day "open" for booking.
        if (availableAtStart || availableAtEnd) {
          isAvailable = true;
          break; // Found a doctor, no need to check others for this day
        }
      }

      daysToReturn.push({
        date: currentDateCursor.format('YYYY-MM-DD'),
        dayLabel: getDayLabel(currentDateCursor, today),
        timezone: patientTz,
        isAvailable,
      });

      currentDateCursor = currentDateCursor.add(1, 'day');
    }

    return NextResponse.json({
      status: 'success',
      data: daysToReturn,
    });

  } catch (error) {
    console.error('Days API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}