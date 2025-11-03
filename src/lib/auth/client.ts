// Client-side auth helpers

const COOKIE_NAME = 'admin_auth';

export type AdminAuth = {
  id: number;
  email: string;
  name: string;
};

// Get admin from cookie
export function getAdminAuth(): AdminAuth | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const adminCookie = cookies.find((c) => c.trim().startsWith(`${COOKIE_NAME}=`));

  if (!adminCookie) return null;

  try {
    const value = adminCookie.split('=')[1];
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

// Check if admin is authenticated
export function isAdminAuthenticated(): boolean {
  return getAdminAuth() !== null;
}

