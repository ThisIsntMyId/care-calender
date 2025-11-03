import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'patient_auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, timezone, categoryId } = await req.json();

    // Validate required fields
    if (!name || !email || !phone || !timezone || !categoryId) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if patient already exists
    const [existingPatient] = await db
      .select()
      .from(patients)
      .where(eq(patients.email, email.toLowerCase()));

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this email already exists. Please login.' },
        { status: 409 }
      );
    }

    // Create new patient
    const [newPatient] = await db
      .insert(patients)
      .values({
        name,
        email: email.toLowerCase(),
        phone,
        timezone,
      })
      .returning();

    // Create initial task (without appointment details yet)
    const [newTask] = await db
      .insert(tasks)
      .values({
        patientId: newPatient.id,
        categoryId: categoryId,
        status: 'pending',
        paymentStatus: 'unpaid',
        tag: 'appointment',
      })
      .returning();

    // Create response with basic auth data
    const authData = {
      id: newPatient.id,
      email: newPatient.email,
      name: newPatient.name,
    };

    const response = NextResponse.json({
      ...authData,
      taskId: newTask.id,
      timezone,
    });

    // Set auth cookie (simple: id, name, email only)
    response.cookies.set(COOKIE_NAME, JSON.stringify(authData), {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Patient signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

