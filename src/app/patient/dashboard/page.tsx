'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPatientAuthenticated, getPatientAuth } from '@/lib/auth/client';
import { PatientNavbar } from '@/components/patient/PatientNavbar';
import { displayClientDateTime } from '@/lib/date-utils';

export default function PatientDashboardPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [patientTimezone, setPatientTimezone] = useState<string>('America/New_York');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPatientAuthenticated()) {
      router.push('/patient/login');
    } else {
      setPatient(getPatientAuth());
      const loadData = async () => {
        await fetchPatientTimezone();
      };
      loadData();
    }
  }, [router]);

  // Fetch tasks when timezone is available
  useEffect(() => {
    if (patientTimezone && patient) {
      fetchTasks();
    }
  }, [patientTimezone, patient]);

  const fetchPatientTimezone = async () => {
    try {
      const response = await fetch('/api/patient/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.timezone) {
          setPatientTimezone(data.timezone);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patient timezone:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/patient/tasks');
      if (response.ok) {
        const data = await response.json();
        // Transform tasks to appointments format
        const transformed = data.map((task: any) => {
          const { date, time } = displayClientDateTime(task.appointmentStartAt, patientTimezone);
          
          return {
            id: task.id,
            category: task.category?.name || 'Unknown',
            doctorName: task.doctor?.name ? `Dr. ${task.doctor.name}` : 'Not assigned',
            date,
            time,
            status: task.appointmentStatus || task.status,
            price: task.category?.price || 0,
            task: task,
          };
        });
        setAppointments(transformed);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (taskId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch('/api/patient/task/cancel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to cancel appointment');
        return;
      }

      // Refresh the appointments list
      await fetchTasks();
      alert('Appointment cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('An error occurred while cancelling the appointment');
    }
  };

  const handleReschedule = (taskId: number) => {
    router.push(`/patient/reschedule/${taskId}`);
  };

  const handleLogout = async () => {
    await fetch('/api/patient/logout', { method: 'POST' });
    router.push('/patient/login');
  };

  if (!patient || loading) {
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
    <div className="min-h-screen bg-gray-50">
      <title>My Appointments - Patient - Care Calendar</title>
      
      {/* Navbar */}
      <PatientNavbar patient={patient} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-8 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600 mt-1">View and manage your consultations</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <a
            href="/patient/signup"
            className="inline-block w-full md:w-auto bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition text-center"
          >
            + Book New Appointment
          </a>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {appointment.category}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>
                        <span className="font-medium">Doctor:</span> {appointment.doctorName}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        <span className="font-medium">Date:</span> {appointment.date}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
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
                      <span>
                        <span className="font-medium">Time:</span> {appointment.time}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        <span className="font-medium">Price:</span> ${appointment.price}
                      </span>
                    </p>
                  </div>
                </div>

                {(appointment.status === 'confirmed' || appointment.status === 'reserved') && (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleReschedule(appointment.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition"
                    >
                      Reschedule
                    </button>
                    <button 
                      onClick={() => handleCancel(appointment.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {appointment.status === 'completed' && (
                  <div>
                    <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition">
                      Book Follow-up
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {appointments.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No appointments yet</p>
            <a
              href="/patient/signup"
              className="inline-block bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition"
            >
              Book Your First Consultation
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

