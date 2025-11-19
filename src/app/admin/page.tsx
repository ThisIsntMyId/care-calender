'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated, getAdminAuth } from '@/lib/auth/client';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    doctors: 0,
    categories: 0,
    activeDoctors: 0,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setAdmin(getAdminAuth());
      fetchStats();
      setLoading(false);
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      const [doctorsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/doctors'),
        fetch('/api/admin/categories'),
      ]);

      if (doctorsRes.ok) {
        const doctors = await doctorsRes.json();
        setStats((prev) => ({
          ...prev,
          doctors: doctors.length,
          activeDoctors: doctors.filter((d: any) => d.status === 'active').length,
        }));
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        setStats((prev) => ({
          ...prev,
          categories: categories.length,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (loading || !admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <title>Admin Dashboard - Care Calendar</title>
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hello, {admin.name}!</h1>
          <p className="text-gray-600 mt-2">Welcome to the Admin Dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.doctors}</p>
              </div>
              <div className="text-4xl">👨‍⚕️</div>
            </div>
            <Link
              href="/admin/doctors"
              className="mt-4 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View all doctors →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Doctors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeDoctors}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <Link
              href="/admin/doctors"
              className="mt-4 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Manage doctors →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Categories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.categories}</p>
              </div>
              <div className="text-4xl">📁</div>
            </div>
            <Link
              href="/admin/categories"
              className="mt-4 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Manage categories →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/doctors"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👨‍⚕️</span>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Doctors</h3>
                  <p className="text-sm text-gray-500">Review and manage doctor applications</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/categories"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📁</span>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Categories</h3>
                  <p className="text-sm text-gray-500">Create and manage service categories</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

