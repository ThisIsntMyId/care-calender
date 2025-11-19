import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctorCategoryAssignments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// PUT - Update doctor assignment (priority, weight)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; doctorId: string }> }
) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, doctorId } = await params;
    const categoryId = parseInt(id);
    const doctorIdNum = parseInt(doctorId);

    const { priority, weight } = await req.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (priority !== undefined) updateData.priority = priority;
    if (weight !== undefined) updateData.weight = weight;

    const [updated] = await db
      .update(doctorCategoryAssignments)
      .set(updateData)
      .where(
        and(
          eq(doctorCategoryAssignments.categoryId, categoryId),
          eq(doctorCategoryAssignments.doctorId, doctorIdNum)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove doctor from category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; doctorId: string }> }
) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, doctorId } = await params;
    const categoryId = parseInt(id);
    const doctorIdNum = parseInt(doctorId);

    await db
      .delete(doctorCategoryAssignments)
      .where(
        and(
          eq(doctorCategoryAssignments.categoryId, categoryId),
          eq(doctorCategoryAssignments.doctorId, doctorIdNum)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

