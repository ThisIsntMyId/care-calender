import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors } from '@/db/schema';

const COOKIE_NAME = 'admin_auth';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all doctors
    const allDoctors = await db.select().from(doctors);

    return NextResponse.json(allDoctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

