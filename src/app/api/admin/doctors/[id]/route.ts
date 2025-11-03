import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { doctors, doctorBusinessHours, categories } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';

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
    const doctorId = parseInt(id);

    // Get doctor data
    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId));

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get business hours
    const businessHoursData = await db
      .select()
      .from(doctorBusinessHours)
      .where(eq(doctorBusinessHours.doctorId, doctorId));

    // Get category details
    let categoryDetails = [];
    if (Array.isArray(doctor.categories) && doctor.categories.length > 0) {
      categoryDetails = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        })
        .from(categories)
        .where(inArray(categories.id, doctor.categories));
    }

    return NextResponse.json({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      bio: doctor.bio,
      qualifications: doctor.qualifications,
      timezone: doctor.timezone,
      categories: categoryDetails,
      status: doctor.status,
      isOnline: doctor.isOnline,
      businessHours: businessHoursData,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

