import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find doctor by email
    const [doctor] = await db
      .select()
      .from(doctors)
      .where(eq(doctors.email, email.toLowerCase()));

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found. Please check your email or sign up.' },
        { status: 404 }
      );
    }

    // Create response with basic auth data
    const authData = {
      id: doctor.id,
      email: doctor.email,
      name: doctor.name,
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
    console.error('Doctor login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

