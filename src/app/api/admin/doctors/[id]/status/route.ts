import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const doctorId = parseInt(id);
    const { status } = await req.json();

    // Validate status
    if (!['active', 'declined', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update doctor status
    const [updatedDoctor] = await db
      .update(doctors)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, doctorId))
      .returning();

    if (!updatedDoctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      doctor: {
        id: updatedDoctor.id,
        name: updatedDoctor.name,
        status: updatedDoctor.status,
      },
    });
  } catch (error) {
    console.error('Update doctor status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

