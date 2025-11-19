import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// GET - Get a single category
export async function GET(
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
    const categoryId = parseInt(id);

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a category
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
    const categoryId = parseInt(id);

    const {
      name,
      slug,
      description,
      durationMinutes,
      requiresAppointment,
      price,
      bufferMinutes,
      isActive,
      selectionAlgorithm,
    } = await req.json();

    // Validate selection algorithm if provided
    if (selectionAlgorithm) {
      const validAlgorithms = ['priority', 'weighted', 'random', 'least_recently_used', 'round_robin'];
      if (!validAlgorithms.includes(selectionAlgorithm)) {
        return NextResponse.json(
          { error: 'Invalid selection algorithm' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (requiresAppointment !== undefined) updateData.requiresAppointment = requiresAppointment;
    if (price !== undefined) updateData.price = price;
    if (bufferMinutes !== undefined) updateData.bufferMinutes = bufferMinutes;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (selectionAlgorithm !== undefined) updateData.selectionAlgorithm = selectionAlgorithm;

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error('Update category error:', error);
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a category
export async function DELETE(
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
    const categoryId = parseInt(id);

    // Check if category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete category (cascade will handle doctor assignments)
    await db.delete(categories).where(eq(categories.id, categoryId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete category error:', error);
    if (error.message?.includes('FOREIGN KEY constraint')) {
      return NextResponse.json(
        { error: 'Cannot delete category: it is being used by tasks' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

