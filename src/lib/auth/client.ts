// Client-side auth helpers

const ADMIN_COOKIE = 'admin_auth';
const DOCTOR_COOKIE = 'doctor_auth';
const PATIENT_COOKIE = 'patient_auth';

export type AuthUser = {
  id: number;
  email: string;
  name: string;
};

// Helper to get cookie value
function getCookie(cookieName: string): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const cookie = cookies.find((c) => c.trim().startsWith(`${cookieName}=`));

  if (!cookie) return null;

  try {
    const value = cookie.split('=')[1];
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

// Admin
export function getAdminAuth(): AuthUser | null {
  return getCookie(ADMIN_COOKIE);
}

export function isAdminAuthenticated(): boolean {
  return getAdminAuth() !== null;
}

// Doctor
export function getDoctorAuth(): AuthUser | null {
  return getCookie(DOCTOR_COOKIE);
}

export function isDoctorAuthenticated(): boolean {
  return getDoctorAuth() !== null;
}

// Patient
export function getPatientAuth(): AuthUser | null {
  return getCookie(PATIENT_COOKIE);
}

export function isPatientAuthenticated(): boolean {
  return getPatientAuth() !== null;
}

