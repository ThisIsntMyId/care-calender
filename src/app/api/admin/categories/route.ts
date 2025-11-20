import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// GET - List all categories
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const cookie = req.cookies.get(COOKIE_NAME);
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const allCategories = await db.select().from(categories).orderBy(desc(categories.createdAt));

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
      nextDays,
      concurrency,
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

    // Validate nextDays
    const validNextDays = [7, 14, 30];
    const daysValue = nextDays || 7;
    if (!validNextDays.includes(daysValue)) {
      return NextResponse.json(
        { error: 'Invalid nextDays value. Must be 7, 14, or 30' },
        { status: 400 }
      );
    }

    // Validate concurrency
    const concurrencyValue = concurrency || 1;
    if (concurrencyValue < 1) {
      return NextResponse.json(
        { error: 'Concurrency must be >= 1' },
        { status: 400 }
      );
    }

    // Validate durationMinutes (must be one of the allowed values)
    const validDurations = [5, 15, 30, 45, 60];
    const durationValue = durationMinutes || 15;
    if (!validDurations.includes(durationValue)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be 5, 15, 30, 45, or 60 minutes' },
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
        durationMinutes: durationValue,
        requiresAppointment: requiresAppointment !== false,
        price,
        bufferMinutes: bufferMinutes || 0,
        isActive: isActive !== false,
        selectionAlgorithm: algorithm,
        nextDays: daysValue,
        concurrency: concurrencyValue,
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

