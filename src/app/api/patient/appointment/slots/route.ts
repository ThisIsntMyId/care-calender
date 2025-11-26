import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories, appointments, doctorCategoryAssignments, doctors, doctorBusinessHours, doctorTimeOff } from '@/db/schema';
import { eq, and, gte, lte, inArray, or } from 'drizzle-orm';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Initialize Day.js plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// --- Types ---

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

interface RawSlot {
  start: dayjs.Dayjs; 
  end: dayjs.Dayjs; 
  time: string; 
  patientTimezone: string; 
}

interface EnrichedSlot {
  time: string;
  start: string; // ISO String
  end: string;   // ISO String
  isAvailable: boolean;
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
  // 1. Get active doctors
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

  // 2. Parallel Fetch: Schedules & Future Time Offs
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

  // 3. Grouping
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

/**
 * Fetch appointments with a buffer to catch overlapping overnight slots
 */
async function getAppointments(categoryId: number, date: dayjs.Dayjs) {
  const queryStart = date.utc().startOf('day').subtract(1, 'day').toDate();
  const queryEnd = date.utc().endOf('day').add(1, 'day').toDate();

  return await db
    .select({
      id: appointments.id,
      doctorId: appointments.doctorId,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.categoryId, categoryId),
        gte(appointments.startAt, queryStart),
        lte(appointments.startAt, queryEnd),
        or(
          eq(appointments.status, 'scheduled'),
          eq(appointments.status, 'confirmed')
        )
      )
    );
}

/**
 * Generate slots based on PATIENT boundaries (Fix #1 & #2)
 */
function generateSlotsInDate(
  date: dayjs.Dayjs,
  durationMinutes: number,
  bufferMinutes: number,
  patientTimezone: string
): RawSlot[] {
  const slots: RawSlot[] = [];
  const now = dayjs(); // Server time for "past time" check
  
  // Use Patient's Day boundaries, NOT UTC
  const dayStart = date.startOf('day'); 
  const dayEnd = date.endOf('day');
  
  const slotIncrement = durationMinutes + bufferMinutes;
  let currentSlot = dayStart;

  while (currentSlot.isBefore(dayEnd)) {
    const slotEnd = currentSlot.add(durationMinutes, 'minute');
    
    if (slotEnd.isAfter(dayEnd)) break;

    // Filter out past times if the date is Today
    // We add a small buffer (e.g. 1 min) so users can't book the *exact* current second
    if (currentSlot.isBefore(now.add(1, 'minute'))) {
        currentSlot = currentSlot.add(slotIncrement, 'minute');
        continue; 
    }

    slots.push({
      start: currentSlot, 
      end: slotEnd,
      time: currentSlot.format('HH:mm'),
      patientTimezone,
    });

    currentSlot = currentSlot.add(slotIncrement, 'minute');
  }

  return slots;
}

/**
 * Check Working Hours (Fix #3: Night Shift Support)
 */
function hasWorkingHours(doctor: DoctorWithScheduleAndTimeOff, slot: RawSlot): boolean {
  // View the slot in the Doctor's Timezone
  const slotStartInDocTz = slot.start.tz(doctor.timezone);
  const slotEndInDocTz = slot.end.tz(doctor.timezone);
  
  const dayOfWeek = slotStartInDocTz.day();

  const businessHours = doctor.schedule.find(
    (s) => s.dayOfWeek === dayOfWeek && s.isEnabled
  );

  if (!businessHours) return false;

  const [startH, startM] = businessHours.startTime.split(':').map(Number);
  const [endH, endM] = businessHours.endTime.split(':').map(Number);

  // Construct strict Shift Start/End for this specific day
  const scheduleStart = slotStartInDocTz.hour(startH).minute(startM).second(0).millisecond(0);
  let scheduleEnd = slotStartInDocTz.hour(endH).minute(endM).second(0).millisecond(0);

  // NIGHT SHIFT FIX: If End < Start (e.g., 22:00 - 06:00), add 1 day to End
  if (scheduleEnd.isBefore(scheduleStart)) {
    scheduleEnd = scheduleEnd.add(1, 'day');
  }

  // Check if slot is completely inside the shift
  return (
    (slotStartInDocTz.isSame(scheduleStart) || slotStartInDocTz.isAfter(scheduleStart)) &&
    (slotEndInDocTz.isSame(scheduleEnd) || slotEndInDocTz.isBefore(scheduleEnd))
  );
}

function hasTimeOff(doctor: DoctorWithScheduleAndTimeOff, slot: RawSlot): boolean {
  const slotStart = slot.start;
  const slotEnd = slot.end;

  return doctor.timeOffs.some((timeOff) => {
    const offStart = dayjs(timeOff.startDateTime);
    const offEnd = dayjs(timeOff.endDateTime);
    // Standard Overlap: StartA < EndB && EndA > StartB
    return slotStart.isBefore(offEnd) && slotEnd.isAfter(offStart);
  });
}

// --- Main API Route ---

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const catId = searchParams.get('catId');
    const dateParam = searchParams.get('date');
    const timezoneParam = searchParams.get('timezone');

    if (!catId || !dateParam || !timezoneParam) {
      return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
    }

    const categoryId = parseInt(catId);
    const patientTz = timezoneParam;

    // Parse date strictly in Patient's Timezone
    // const patientDate = dayjs.tz(dateParam, 'DD-MM-YYYY', patientTz);
    const patientDate = dayjs.tz(dateParam, 'YYYY-MM-DD', patientTz);

    if (!patientDate.isValid()) {
      return NextResponse.json({ error: 'Invalid date format (YYYY-MM-DD)' }, { status: 400 });
    }

    const category = await getCategoryById(categoryId);
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    // 1. Get Doctors
    const doctorsList = await getDoctorsWithScheduleAndTimeOff(categoryId);
    if (doctorsList.length === 0) {
      return NextResponse.json({ status: 'success', data: { date: patientDate.format('YYYY-MM-DD'), slots: [] } });
    }

    // 2. Get Appointments
    const appointments = await getAppointments(categoryId, patientDate);
    
    // Optimization: Index appointments by Doctor ID
    const appointmentsByDoc: Record<number, typeof appointments> = {};
    for (const apt of appointments) {
        if(apt.doctorId) {
            if (!appointmentsByDoc[apt.doctorId]) appointmentsByDoc[apt.doctorId] = [];
            appointmentsByDoc[apt.doctorId].push(apt);
        }
    }

    // 3. Generate Raw Slots
    const rawSlots = generateSlotsInDate(
      patientDate,
      category.durationMinutes || 30,
      category.bufferMinutes || 0,
      patientTz
    );

    // 4. Calculate Availability
    // We use a Map to aggregate availability across all doctors for each time slot
    const slotsMap = new Map<string, EnrichedSlot>();

    // Flattened Loop: Slots -> Doctors
    for (const slot of rawSlots) {
      let isSlotAvailableAnywhere = false;

      for (const doctor of doctorsList) {
        // a. Check Working Hours
        if (!hasWorkingHours(doctor, slot)) continue;

        // b. Check Time Off
        if (hasTimeOff(doctor, slot)) continue;

        // c. Check Appointments
        const docAppts = appointmentsByDoc[doctor.id] || [];
        const conflictCount = docAppts.filter(apt => {
            const aptStart = dayjs(apt.startAt);
            const aptEnd = dayjs(apt.endAt);
            return slot.start.isBefore(aptEnd) && slot.end.isAfter(aptStart);
        }).length;

        // If this doctor can take the appointment, mark slot as available
        if (conflictCount < (category.concurrency || 1)) {
            isSlotAvailableAnywhere = true;
            break; // Optimization: We found ONE doctor who is free, so the slot is valid.
        }
      }

      // Add to map (or update if needed)
      // Since we break early above, we just need to record the slot existence and status
      slotsMap.set(slot.time, {
          time: slot.time,
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          isAvailable: isSlotAvailableAnywhere
      });
    }

    // 5. Sort and Return
    const finalSlots = Array.from(slotsMap.values()).sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({
      status: 'success',
      data: {
        date: patientDate.format('YYYY-MM-DD'),
        slots: finalSlots,
      },
    });

  } catch (error) {
    console.error('Slots API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}