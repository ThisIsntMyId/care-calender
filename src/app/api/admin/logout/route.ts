import { NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_auth';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear auth cookie
  response.cookies.set(COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
  });

  return response;
}

