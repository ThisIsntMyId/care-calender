import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { patients } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'patient_auth';

// GET - Fetch patient profile
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const [patient] = await db.select().from(patients).where(eq(patients.id, authData.id));

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      timezone: patient.timezone,
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update patient profile
export async function PUT(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Update patient
    await db
      .update(patients)
      .set({
        name,
        phone,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, authData.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update patient profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

