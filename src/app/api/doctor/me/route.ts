import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors, doctorBusinessHours, doctorTimeOff } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';

export async function GET(req: NextRequest) {
  try {
    // Get doctor auth from cookie
    const cookie = req.cookies.get(COOKIE_NAME);

    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);

    // Get fresh doctor data from DB
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, authData.id));

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get business hours
    const businessHoursData = await db
      .select()
      .from(doctorBusinessHours)
      .where(eq(doctorBusinessHours.doctorId, doctor.id));

    // Get upcoming time off (future only)
    const upcomingTimeOff = await db
      .select()
      .from(doctorTimeOff)
      .where(
        eq(doctorTimeOff.doctorId, doctor.id)
      );

    // Filter upcoming (end date in future)
    const now = new Date();
    const futureTimeOff = upcomingTimeOff.filter(
      (timeOff) => new Date(timeOff.endDateTime) >= now
    );

    // Return full doctor data
    return NextResponse.json({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      bio: doctor.bio,
      qualifications: doctor.qualifications,
      timezone: doctor.timezone,
      categories: doctor.categories,
      status: doctor.status,
      isOnline: doctor.isOnline,
      businessHours: businessHoursData,
      upcomingTimeOff: futureTimeOff,
      hasBusinessHours: businessHoursData.length > 0,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    });
  } catch (error) {
    console.error('Get doctor me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

