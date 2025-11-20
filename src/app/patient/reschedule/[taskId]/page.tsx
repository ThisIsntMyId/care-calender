'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isPatientAuthenticated, getPatientAuth } from '@/lib/auth/client';
import { PatientNavbar } from '@/components/patient/PatientNavbar';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function PatientReschedulePage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.taskId as string;
  
  const [patient, setPatient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('Nov 3');
  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isPatientAuthenticated()) {
      router.push('/patient/login');
    } else {
      setPatient(getPatientAuth());
      setPageLoading(false);
    }
  }, [router]);

  const days = [
    { date: 'Nov 3', day: 'Today', available: 19 },
    { date: 'Nov 4', day: 'Tomorrow', available: 25 },
    { date: 'Nov 5', day: 'Wed', available: 36 },
    { date: 'Nov 6', day: 'Thu', available: 31 },
    { date: 'Nov 7', day: 'Fri', available: 11 },
    { date: 'Nov 8', day: 'Sat', available: 30 },
    { date: 'Nov 9', day: 'Sun', available: 28 },
    { date: 'Nov 10', day: 'Mon', available: 32 },
    { date: 'Nov 11', day: 'Tue', available: 24 },
  ];

  const morningSlots = ['9:00 AM', '9:15 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'];
  const afternoonSlots = [
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '2:15 PM',
    '2:45 PM',
    '3:30 PM',
    '4:00 PM',
  ];
  const eveningSlots = ['5:00 PM', '5:15 PM', '5:45 PM', '6:00 PM', '6:30 PM'];

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    if (!taskId) {
      alert('Task ID is missing');
      return;
    }

    setLoading(true);

    try {
      // Parse date string (e.g., "Nov 3" -> "2025-11-03")
      const [monthStr, dayStr] = selectedDate.split(' ');
      const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const dateStr = `2025-${monthMap[monthStr]}-${dayStr.padStart(2, '0')}`;
      
      // Parse time (e.g., "3:30 PM" -> "15:30")
      const [timePart, period] = selectedTime.split(' ');
      const [hours, minutes] = timePart.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 = hours + 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      const timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      // Create date in local timezone, then convert to UTC for storage
      const localDateTime = dayjs(`${dateStr} ${timeStr}`);
      const scheduledStartAt = localDateTime.utc();
      const scheduledEndAt = scheduledStartAt.add(15, 'minute');

      // Update task with new schedule
      const response = await fetch('/api/patient/task/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: parseInt(taskId),
          scheduledStartAt: scheduledStartAt.toISOString(),
          scheduledEndAt: scheduledEndAt.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to reschedule appointment');
        setLoading(false);
        return;
      }

      // Redirect back to dashboard
      router.push('/patient/dashboard');
    } catch (error) {
      console.error('Failed to reschedule:', error);
      alert('An error occurred');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/patient/logout', { method: 'POST' });
    router.push('/patient/login');
  };


  if (pageLoading || !patient) {
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
      <title>Reschedule Appointment - Patient - Care Calendar</title>
      
      {/* Navbar */}
      <PatientNavbar patient={patient} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-8 pb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reschedule Your Consultation</h2>
        <p className="text-gray-600 mb-6">
          Appointments are 15 minutes. The first available is November 4.
        </p>

        {/* Select Day */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Select a day</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(day.date)}
                className={`p-3 border-2 rounded-lg text-center transition ${
                  selectedDate === day.date
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-200 hover:border-green-500 text-gray-900'
                }`}
              >
                <div className="text-sm font-semibold">{day.day}</div>
                <div className="text-xs">{day.date}</div>
                <div className="text-xs mt-1">{day.available} available</div>
              </button>
            ))}
          </div>
        </div>

        {/* Select Time */}
        {selectedDate && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Select a time</h3>

            {/* Morning */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Morning</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {morningSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 border-2 rounded-md text-sm transition ${
                      selectedTime === time
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-200 hover:border-green-500 text-gray-900'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Afternoon */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Afternoon</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {afternoonSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 border-2 rounded-md text-sm transition ${
                      selectedTime === time
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-200 hover:border-green-500 text-gray-900'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Evening */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Evening</h4>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {eveningSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 border-2 rounded-md text-sm transition ${
                      selectedTime === time
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-200 hover:border-green-500 text-gray-900'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTime && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Your appointment is set for:{' '}
              <span className="font-semibold">
                Monday, {selectedDate}, 2025 at {selectedTime}
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => router.push('/patient/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

