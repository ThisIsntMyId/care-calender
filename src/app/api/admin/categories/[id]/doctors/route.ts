import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctorCategoryAssignments, doctors, categories } from '@/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

// GET - Get all doctors assigned to a category
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

    // Get all doctor assignments for this category
    const assignments = await db
      .select({
        id: doctorCategoryAssignments.id,
        doctorId: doctorCategoryAssignments.doctorId,
        priority: doctorCategoryAssignments.priority,
        weight: doctorCategoryAssignments.weight,
        lastAssignedAt: doctorCategoryAssignments.lastAssignedAt,
        roundRobinIndex: doctorCategoryAssignments.roundRobinIndex,
        doctor: {
          id: doctors.id,
          name: doctors.name,
          email: doctors.email,
          status: doctors.status,
          isOnline: doctors.isOnline,
        },
      })
      .from(doctorCategoryAssignments)
      .innerJoin(doctors, eq(doctorCategoryAssignments.doctorId, doctors.id))
      .where(eq(doctorCategoryAssignments.categoryId, categoryId))
      .orderBy(asc(doctors.name));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Get category doctors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Assign doctors to a category
export async function POST(
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

    const { doctorIds, priority, weight } = await req.json();

    // Validate input
    if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
      return NextResponse.json(
        { error: 'doctorIds array is required' },
        { status: 400 }
      );
    }

    // Verify category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify all doctors exist
    const existingDoctors = await db
      .select({ id: doctors.id })
      .from(doctors)
      .where(inArray(doctors.id, doctorIds));

    if (existingDoctors.length !== doctorIds.length) {
      return NextResponse.json(
        { error: 'One or more doctors not found' },
        { status: 404 }
      );
    }

    // Check for existing assignments and create new ones
    const existingAssignments = await db
      .select()
      .from(doctorCategoryAssignments)
      .where(
        and(
          eq(doctorCategoryAssignments.categoryId, categoryId),
          inArray(doctorCategoryAssignments.doctorId, doctorIds)
        )
      );

    const existingDoctorIds = new Set(existingAssignments.map((a) => a.doctorId));
    const assignments = doctorIds
      .filter((doctorId) => !existingDoctorIds.has(doctorId))
      .map((doctorId) => ({
        doctorId,
        categoryId,
        priority: priority !== undefined ? priority : 100,
        weight: weight !== undefined ? weight : 50,
        roundRobinIndex: 0,
      }));

    if (assignments.length > 0) {
      await db.insert(doctorCategoryAssignments).values(assignments);
    }

    return NextResponse.json({ success: true, assigned: assignments.length }, { status: 201 });
  } catch (error) {
    console.error('Assign doctors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

