import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { isOnline } = await req.json();

    // Update doctor online status
    await db
      .update(doctors)
      .set({
        isOnline,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, authData.id));

    return NextResponse.json({ success: true, isOnline });
  } catch (error) {
    console.error('Toggle online error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

