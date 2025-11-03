import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctorTimeOff } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';

// GET - Fetch all time off for doctor
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);

    const timeOffRecords = await db
      .select()
      .from(doctorTimeOff)
      .where(eq(doctorTimeOff.doctorId, authData.id));

    return NextResponse.json(timeOffRecords);
  } catch (error) {
    console.error('Get time off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create time off
export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { startDateTime, endDateTime, reason } = await req.json();

    if (!startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Start and end date/time are required' },
        { status: 400 }
      );
    }

    const [newTimeOff] = await db
      .insert(doctorTimeOff)
      .values({
        doctorId: authData.id,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        reason: reason || null,
      })
      .returning();

    return NextResponse.json(newTimeOff);
  } catch (error) {
    console.error('Create time off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

