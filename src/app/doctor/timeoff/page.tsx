'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isDoctorAuthenticated } from '@/lib/auth/client';
import { format } from 'date-fns';

export default function DoctorTimeOffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeOffList, setTimeOffList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [timeOffData, setTimeOffData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    reason: '',
  });

  useEffect(() => {
    if (!isDoctorAuthenticated()) {
      router.push('/doctor/login');
      return;
    }

    fetchTimeOff();
  }, [router]);

  const fetchTimeOff = async () => {
    try {
      const response = await fetch('/api/doctor/timeoff');
      if (response.ok) {
        const data = await response.json();
        setTimeOffList(data);
      }
    } catch (error) {
      console.error('Failed to fetch time off:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const startDateTime = new Date(`${timeOffData.startDate}T${timeOffData.startTime}`);
      const endDateTime = new Date(`${timeOffData.endDate}T${timeOffData.endTime}`);

      const response = await fetch('/api/doctor/timeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          reason: timeOffData.reason,
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setTimeOffData({
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          reason: '',
        });
        fetchTimeOff(); // Refresh list
      } else {
        alert('Failed to schedule time off');
      }
    } catch (error) {
      console.error('Failed to add time off:', error);
      alert('An error occurred');
    }
  };

  const handleDeleteTimeOff = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time off period?')) {
      return;
    }

    try {
      const response = await fetch(`/api/doctor/timeoff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTimeOff(); // Refresh list
      } else {
        alert('Failed to delete time off');
      }
    } catch (error) {
      console.error('Failed to delete time off:', error);
      alert('An error occurred');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Off Management</h1>
            <p className="text-gray-600 mt-1">Manage your vacation and unavailable periods</p>
          </div>
          <Link
            href="/doctor/dashboard"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Add Time Off Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Time Off
          </button>
        </div>

        {/* Time Off List */}
        <div className="space-y-4">
          {timeOffList.map((timeOff) => {
            const startDate = new Date(timeOff.startDateTime);
            const endDate = new Date(timeOff.endDateTime);
            const isPast = endDate < new Date();

            return (
              <div
                key={timeOff.id}
                className={`bg-white rounded-lg shadow-md p-6 ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {timeOff.reason || 'Time Off'}
                      </h3>
                      {isPast && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          Past
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>From:</strong>{' '}
                        {format(startDate, 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                      <p>
                        <strong>To:</strong> {format(endDate, 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                  {!isPast && (
                    <button
                      onClick={() => handleDeleteTimeOff(timeOff.id)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {timeOffList.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No time off scheduled</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Schedule Your First Time Off
            </button>
          </div>
        )}

        {/* Add Time Off Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Schedule Time Off</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTimeOff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={timeOffData.startDate}
                      onChange={(e) =>
                        setTimeOffData({ ...timeOffData, startDate: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={timeOffData.startTime}
                      onChange={(e) =>
                        setTimeOffData({ ...timeOffData, startTime: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={timeOffData.endDate}
                      onChange={(e) =>
                        setTimeOffData({ ...timeOffData, endDate: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={timeOffData.endTime}
                      onChange={(e) =>
                        setTimeOffData({ ...timeOffData, endTime: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={timeOffData.reason}
                    onChange={(e) =>
                      setTimeOffData({ ...timeOffData, reason: e.target.value })
                    }
                    placeholder="Vacation, Personal, Sick leave, etc."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> During this time period, you won't receive any new
                    appointment requests. Existing appointments will not be affected.
                  </p>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Schedule Time Off
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

