'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isDoctorAuthenticated } from '@/lib/auth/client';
import { getTimezoneOptions } from '@/lib/timezones';

export default function DoctorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timezoneOptions, setTimezoneOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    qualifications: '',
    timezone: '',
  });
  const [businessHours, setBusinessHours] = useState<any[]>([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (!isDoctorAuthenticated()) {
      router.push('/doctor/login');
      return;
    }

    // Get timezone options
    const options = getTimezoneOptions();
    setTimezoneOptions(options);

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/doctor/profile');
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name,
            email: data.email,
            phone: data.phone,
            bio: data.bio || '',
            qualifications: data.qualifications,
            timezone: data.timezone,
          });
          setBusinessHours(data.businessHours || []);
        } else {
          router.push('/doctor/login');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessHours,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <title>Doctor Profile - Care Calendar</title>
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Profile</h1>
              <p className="text-gray-600 mt-1">Update your profile information</p>
            </div>
            <Link
              href="/doctor/dashboard"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone *
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    {timezoneOptions.length === 0 && (
                      <option value="">Loading timezones...</option>
                    )}
                    {timezoneOptions.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Professional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualifications *
                  </label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) =>
                      setFormData({ ...formData, qualifications: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add multiple time slots per day to accommodate breaks or split schedules.
              </p>
              <div className="space-y-4">
                {days.map((day, index) => {
                  const dayOfWeek = index === 0 ? 1 : index === 6 ? 0 : index + 1;
                  const dayHours = businessHours.filter((h) => h.dayOfWeek === dayOfWeek);

                  return (
                    <div key={day} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{day}</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setBusinessHours([
                              ...businessHours,
                              {
                                dayOfWeek,
                                startTime: '09:00',
                                endTime: '17:00',
                                isEnabled: true,
                              },
                            ]);
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Slot
                        </button>
                      </div>
                      <div className="space-y-2">
                        {dayHours.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No hours set for this day</p>
                        )}
                        {dayHours.map((hours, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={hours.startTime}
                              onChange={(e) => {
                                const newHours = [...businessHours];
                                const globalIndex = newHours.findIndex(
                                  (h, i) =>
                                    h.dayOfWeek === dayOfWeek &&
                                    businessHours.filter((bh) => bh.dayOfWeek === dayOfWeek).indexOf(h) === slotIndex
                                );
                                if (globalIndex !== -1) {
                                  newHours[globalIndex].startTime = e.target.value;
                                  setBusinessHours(newHours);
                                }
                              }}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={hours.endTime}
                              onChange={(e) => {
                                const newHours = [...businessHours];
                                const globalIndex = newHours.findIndex(
                                  (h, i) =>
                                    h.dayOfWeek === dayOfWeek &&
                                    businessHours.filter((bh) => bh.dayOfWeek === dayOfWeek).indexOf(h) === slotIndex
                                );
                                if (globalIndex !== -1) {
                                  newHours[globalIndex].endTime = e.target.value;
                                  setBusinessHours(newHours);
                                }
                              }}
                              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newHours = businessHours.filter((h, i) => {
                                  if (h.dayOfWeek !== dayOfWeek) return true;
                                  return businessHours.filter((bh) => bh.dayOfWeek === dayOfWeek).indexOf(h) !== slotIndex;
                                });
                                setBusinessHours(newHours);
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Link
                href="/doctor/dashboard"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

