import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors, doctorBusinessHours } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, timezone, qualifications, bio } =
      await req.json();

    // Validate required fields
    if (!name || !email || !phone || !timezone || !qualifications) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if doctor already exists
    const [existingDoctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.email, email.toLowerCase()));

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor with this email already exists' },
        { status: 409 }
      );
    }

    // Create new doctor
    const [newDoctor] = await db
      .insert(doctors)
      .values({
        name,
        email: email.toLowerCase(),
        phone,
        timezone,
        qualifications,
        bio: bio || null,
        status: 'in_review', // Default status
        isOnline: false, // Default to offline
      })
      .returning();

    // Create default business hours: Mon-Fri 9 AM - 6 PM
    // dayOfWeek: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday
    const defaultBusinessHours = [
      { doctorId: newDoctor.id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isEnabled: true }, // Monday
      { doctorId: newDoctor.id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isEnabled: true }, // Tuesday
      { doctorId: newDoctor.id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isEnabled: true }, // Wednesday
      { doctorId: newDoctor.id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isEnabled: true }, // Thursday
      { doctorId: newDoctor.id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isEnabled: true }, // Friday
      // Saturday (6) and Sunday (0) are off - not added
    ];

    await db.insert(doctorBusinessHours).values(defaultBusinessHours);

    // Create response with basic auth data
    const authData = {
      id: newDoctor.id,
      email: newDoctor.email,
      name: newDoctor.name,
    };

    const response = NextResponse.json(authData);

    // Set auth cookie (simple: id, name, email only)
    response.cookies.set(COOKIE_NAME, JSON.stringify(authData), {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Doctor signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

