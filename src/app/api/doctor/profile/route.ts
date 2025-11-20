import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors, doctorBusinessHours } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';

// GET - Fetch doctor profile
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, authData.id));

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const businessHoursData = await db
      .select()
      .from(doctorBusinessHours)
      .where(eq(doctorBusinessHours.doctorId, doctor.id));

    return NextResponse.json({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      bio: doctor.bio,
      qualifications: doctor.qualifications,
      timezone: doctor.timezone,
      businessHours: businessHoursData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update doctor profile
export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { name, phone, bio, qualifications, timezone, businessHours } = await req.json();

    // Update doctor
    await db
      .update(doctors)
      .set({
        name,
        phone,
        bio,
        qualifications,
        timezone,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, authData.id));

    // Delete existing business hours and insert new ones
    await db.delete(doctorBusinessHours).where(eq(doctorBusinessHours.doctorId, authData.id));

    if (businessHours && Array.isArray(businessHours) && businessHours.length > 0) {
      const businessHoursData = businessHours.map((bh: any) => ({
        doctorId: authData.id,
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isEnabled: bh.isEnabled,
      }));

      await db.insert(doctorBusinessHours).values(businessHoursData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

