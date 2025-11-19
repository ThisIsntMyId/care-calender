import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

// GET - List all active categories (public endpoint)
export async function GET(req: NextRequest) {
  try {
    // Get only active categories, ordered by name
    const activeCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        durationMinutes: categories.durationMinutes,
        price: categories.price,
        requiresAppointment: categories.requiresAppointment,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name));

    return NextResponse.json(activeCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

