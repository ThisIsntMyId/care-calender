import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.toLowerCase()));

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found. Please check your email or sign up.' },
        { status: 404 }
      );
    }

    // Create response with admin data
    const adminData = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };

    const response = NextResponse.json(adminData);

    // Set auth cookie
    response.cookies.set(COOKIE_NAME, JSON.stringify(adminData), {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

