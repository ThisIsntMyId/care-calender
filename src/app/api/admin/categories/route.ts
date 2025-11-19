import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// GET - List all categories
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const allCategories = await db.select().from(categories).orderBy(categories.name);

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new category
export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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

    // Validate required fields
    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        { error: 'Name, slug, and price are required' },
        { status: 400 }
      );
    }

    // Validate selection algorithm
    const validAlgorithms = ['priority', 'weighted', 'random', 'least_recently_used', 'round_robin'];
    const algorithm = selectionAlgorithm || 'round_robin';
    if (!validAlgorithms.includes(algorithm)) {
      return NextResponse.json(
        { error: 'Invalid selection algorithm' },
        { status: 400 }
      );
    }

    // Create category
    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description: description || null,
        durationMinutes: durationMinutes || 15,
        requiresAppointment: requiresAppointment !== false,
        price,
        bufferMinutes: bufferMinutes || 0,
        isActive: isActive !== false,
        selectionAlgorithm: algorithm,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

