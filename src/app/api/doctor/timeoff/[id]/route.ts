import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctorTimeOff } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const COOKIE_NAME = 'doctor_auth';

// DELETE - Remove time off
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(cookie.value);
    const { id } = await params;
    const timeOffId = parseInt(id);

    // Delete time off (ensure it belongs to this doctor)
    await db
      .delete(doctorTimeOff)
      .where(
        and(
          eq(doctorTimeOff.id, timeOffId),
          eq(doctorTimeOff.doctorId, authData.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete time off error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

