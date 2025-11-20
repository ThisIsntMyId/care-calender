'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isDoctorAuthenticated } from '@/lib/auth/client';
import { DoctorNavbar } from '@/components/doctor/DoctorNavbar';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [timeOffData, setTimeOffData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    reason: '',
  });

  // Check authentication and fetch doctor data
  useEffect(() => {
    if (!isDoctorAuthenticated()) {
      router.push('/doctor/login');
      return;
    }

    // Fetch fresh doctor data from API
    const fetchDoctorData = async () => {
      try {
        const response = await fetch('/api/doctor/me');
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
        } else {
          router.push('/doctor/login');
        }
      } catch (error) {
        console.error('Failed to fetch doctor data:', error);
        router.push('/doctor/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [router]);

  const fetchTasks = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/doctor/tasks?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        // Transform tasks to display format
        const transformed = data.map((task: any) => ({
          id: task.id,
          patientName: task.patient?.name || 'Unknown',
          category: task.category?.name || 'Unknown',
          time: task.appointmentStartAt
            ? new Date(task.appointmentStartAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'Not scheduled',
          status: task.appointmentStatus || task.status,
          type: task.tag || 'appointment',
          task: task,
        }));
        setTasks(transformed);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (doctor && doctor.status === 'active') {
      fetchTasks();
    }
  }, [doctor]);

  const handleLogout = async () => {
    await fetch('/api/doctor/logout', { method: 'POST' });
    router.push('/doctor/login');
  };

  const handleToggleOnline = async (isOnline: boolean) => {
    try {
      const response = await fetch('/api/doctor/toggle-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline }),
      });

      if (response.ok) {
        // Update local state
        setDoctor({ ...doctor, isOnline });
      }
    } catch (error) {
      console.error('Failed to toggle online status:', error);
    }
  };

  const handleAddTimeOff = async () => {
    try {
      // Combine date and time into full datetime
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
        alert('Time off scheduled successfully!');
        setShowTimeOffModal(false);
        setTimeOffData({
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          reason: '',
        });
        // Refresh doctor data to show updated time off
        const meResponse = await fetch('/api/doctor/me');
        if (meResponse.ok) {
          const data = await meResponse.json();
          setDoctor(data);
        }
      } else {
        alert('Failed to schedule time off');
      }
    } catch (error) {
      console.error('Failed to add time off:', error);
      alert('An error occurred');
    }
  };

  // Show loading state
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

  // Show nothing if no doctor data
  if (!doctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <title>Doctor Dashboard - Care Calendar</title>
      
      {/* Navbar */}
      <DoctorNavbar doctor={doctor} onLogout={handleLogout} onToggleOnline={handleToggleOnline} />

      {/* Only show full dashboard if status is active */}
      {doctor.status !== 'active' ? (
        <div className="max-w-6xl mx-auto px-8 py-12 text-center">
          <p className="text-gray-500 text-lg">
            Your dashboard will be available once your account is activated.
          </p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-8 pb-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Today's Appointments</h2>
            <p className="text-gray-600 mt-1">November 3, 2025</p>
          </div>

        {/* Actions Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Online Status Toggle */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Availability Status</h3>
              <p className="text-sm text-gray-600">Toggle to control appointment visibility</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={doctor.isOnline}
                onChange={(e) => handleToggleOnline(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {doctor.isOnline ? 'Online' : 'Offline'}
              </span>
            </label>
          </div>

          {/* Time Off CTA */}
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Time Off</h3>
              <p className="text-sm text-gray-600">Schedule vacation or unavailable periods</p>
            </div>
            <button
              onClick={() => setShowTimeOffModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Today's Tasks ({tasksLoading ? '...' : tasks.length})
            </h2>
          </div>

          {tasksLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{task.patientName}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {task.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {task.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                        {task.status}
                      </span>
                      <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Time Off Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Schedule Time Off</h2>
              <button
                onClick={() => setShowTimeOffModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4">
              {/* Start Date & Time */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* End Date & Time */}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Reason */}
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

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> During this time period, you won't receive any new
                  appointment requests. Existing appointments will not be affected.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTimeOffModal(false)}
                  className="flex-1 px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddTimeOff();
                  }}
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
  );
}

