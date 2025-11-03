import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'patient_auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find patient by email
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.email, email.toLowerCase()));

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found. Please check your email or sign up.' },
        { status: 404 }
      );
    }

    // Create response with basic auth data
    const authData = {
      id: patient.id,
      email: patient.email,
      name: patient.name,
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
    console.error('Patient login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

