import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'admin_auth';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.toLowerCase()));

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    // Create new admin
    const [newAdmin] = await db
      .insert(admins)
      .values({
        name,
        email: email.toLowerCase(),
      })
      .returning();

    // Create response with admin data
    const adminData = {
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
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
    console.error('Admin signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

