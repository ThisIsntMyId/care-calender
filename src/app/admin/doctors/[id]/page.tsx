'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/auth/client';

export default function AdminDoctorViewPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchDoctor();
  }, [router, doctorId]);

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setDoctor(data);
      } else {
        router.push('/admin/doctors');
      }
    } catch (error) {
      console.error('Failed to fetch doctor:', error);
      router.push('/admin/doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh doctor data
        await fetchDoctor();
      } else {
        alert('Failed to update doctor status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <title>Doctor Details - Admin - Care Calendar</title>
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/doctors"
              className="text-sm text-green-600 hover:text-green-700 font-medium mb-2 inline-block"
            >
              ← Back to Doctors List
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Details</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {doctor.status === 'in_review' && (
              <>
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleStatusChange('declined')}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'Decline'}
                </button>
              </>
            )}
            {doctor.status === 'active' && (
              <button
                onClick={() => handleStatusChange('suspended')}
                disabled={actionLoading}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Suspend'}
              </button>
            )}
            {doctor.status === 'suspended' && (
              <button
                onClick={() => handleStatusChange('active')}
                disabled={actionLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Reactivate'}
              </button>
            )}
          </div>
        </div>

        {/* Doctor Information Cards */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  doctor.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : doctor.status === 'in_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : doctor.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {doctor.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 mt-1">{doctor.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 mt-1">{doctor.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900 mt-1">{doctor.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Timezone</label>
                <p className="text-gray-900 mt-1">{doctor.timezone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Online Status</label>
                <p className="text-gray-900 mt-1">
                  <span className={`inline-flex items-center gap-1.5`}>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {doctor.isOnline ? 'Online' : 'Offline'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Qualifications</label>
                <p className="text-gray-900 mt-1">{doctor.qualifications}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bio</label>
                <p className="text-gray-900 mt-1">{doctor.bio || 'No bio provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Categories</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Array.isArray(doctor.categories) && doctor.categories.length > 0 ? (
                    doctor.categories.map((category: any) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {category.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No categories selected</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h2>
            {doctor.businessHours && doctor.businessHours.length > 0 ? (
              <div className="space-y-3">
                {days.map((day, dayIndex) => {
                  const daySlots = doctor.businessHours.filter(
                    (h: any) => h.dayOfWeek === dayIndex
                  );

                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day} className="flex items-start gap-4">
                      <div className="w-32 font-medium text-gray-900">{day}</div>
                      <div className="flex-1 space-y-1">
                        {daySlots.map((slot: any, idx: number) => (
                          <div key={idx} className="text-gray-700">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No business hours set</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

