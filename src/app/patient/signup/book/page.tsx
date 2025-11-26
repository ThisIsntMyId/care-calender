'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { guessUserTimezone } from '@/lib/timezones';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

interface DayAvailability {
  date: string;
  dayLabel: string;
  timezone: string;
  isAvailable: boolean;
}

interface Slot {
  time: string;
  start: string;
  end: string;
  isAvailable: boolean;
}

export default function PatientBookPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [patientTimezone, setPatientTimezone] = useState<string>('America/New_York');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useEffect(() => {
    // Get category ID and task ID from localStorage
    const existingData = JSON.parse(localStorage.getItem('patient_signup_data') || '{}');
    if (!existingData.categoryId || !existingData.taskId) {
      router.push('/patient/signup');
      return;
    }
    setCategoryId(existingData.categoryId);

    // Check if task is already booked
    const checkTaskStatus = async () => {
      try {
        const response = await fetch('/api/patient/tasks');
        if (response.ok) {
          const tasks = await response.json();
          const task = tasks.find((t: any) => t.id === existingData.taskId);
          if (task && task.status !== 'pending' && task.appointment) {
            // Task is already booked, redirect to summary
            router.push('/patient/signup/summary');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check task status:', error);
      }
    };

    checkTaskStatus();

    // Get patient timezone
    const fetchPatientTimezone = async () => {
      try {
        const response = await fetch('/api/patient/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.timezone) {
            setPatientTimezone(data.timezone);
          } else {
            // Fallback to guessed timezone
            const guessed = guessUserTimezone();
            if (guessed) setPatientTimezone(guessed);
          }
        } else {
          // Fallback to guessed timezone
          const guessed = guessUserTimezone();
          if (guessed) setPatientTimezone(guessed);
        }
      } catch (error) {
        console.error('Failed to fetch patient timezone:', error);
        const guessed = guessUserTimezone();
        if (guessed) setPatientTimezone(guessed);
      }
    };

    fetchPatientTimezone();
  }, [router]);

  useEffect(() => {
    if (categoryId && patientTimezone) {
      fetchAvailableDays();
    }
  }, [categoryId, patientTimezone]);

  useEffect(() => {
    if (selectedDate && categoryId && patientTimezone) {
      fetchAvailableSlots();
    } else {
      setSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate, categoryId, patientTimezone]);

  const fetchAvailableDays = async () => {
    if (!categoryId) return;
    
    try {
      setPageLoading(true);
      const response = await fetch(
        `/api/patient/appointment/days?catId=${categoryId}&timezone=${encodeURIComponent(patientTimezone)}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setDays(result.data);
          // Auto-select first available day and fetch slots immediately
          const firstAvailable = result.data.find((d: DayAvailability) => d.isAvailable);
          if (firstAvailable) {
            setSelectedDate(firstAvailable.date);
            // Fetch slots for the first available day immediately
            await fetchAvailableSlotsForDate(firstAvailable.date);
          }
        }
      } else {
        console.error('Failed to fetch available days');
      }
    } catch (error) {
      console.error('Error fetching days:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchAvailableSlotsForDate = async (date: string) => {
    if (!categoryId || !date) return;
    
    try {
      setSlotsLoading(true);
      const response = await fetch(
        `/api/patient/appointment/slots?catId=${categoryId}&date=${date}&timezone=${encodeURIComponent(patientTimezone)}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && result.data.slots) {
          setSlots(result.data.slots);
        }
      } else {
        console.error('Failed to fetch available slots');
        setSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!categoryId || !selectedDate) return;
    await fetchAvailableSlotsForDate(selectedDate);
  };

  const handleContinue = async () => {
    if (!selectedDate || !selectedSlot) {
      alert('Please select both date and time');
      return;
    }

    if (!selectedSlot.isAvailable) {
      alert('This time slot is no longer available. Please select another time.');
      return;
    }

    setLoading(true);

    try {
      // Get existing data from localStorage
      const existingData = JSON.parse(localStorage.getItem('patient_signup_data') || '{}');

      if (!existingData.taskId) {
        router.push('/patient/signup');
        return;
      }

      // Use the schedule API
      const response = await fetch('/api/patient/appointment/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: existingData.taskId,
          slotStart: selectedSlot.start,
          timezone: patientTimezone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to schedule appointment');
        setLoading(false);
        return;
      }

      const result = await response.json();
      if (result.status === 'success') {
        // Fetch task details to get doctor info
        const tasksResponse = await fetch('/api/patient/tasks');
        let doctorName = 'Not assigned';
        if (tasksResponse.ok) {
          const tasks = await tasksResponse.json();
          const task = tasks.find((t: any) => t.id === existingData.taskId);
          if (task?.doctor?.name) {
            doctorName = `Dr. ${task.doctor.name}`;
          }
        }

        // Format the appointment date/time in patient's timezone
        const appointmentDate = dayjs(selectedSlot.start).tz(patientTimezone);
        const formattedAppointmentDate = appointmentDate.format('dddd, MMMM D, YYYY');
        const formattedAppointmentTime = appointmentDate.format('h:mm A');
        
        // Get timezone abbreviation using dayjs native support
        const tzAbbr = appointmentDate.format('z');

        // Save to localStorage and continue
        localStorage.setItem(
          'patient_signup_data',
          JSON.stringify({
            ...existingData,
            selectedDate,
            selectedSlot: selectedSlot.time,
            appointmentId: result.data.id,
            appointmentStartAt: selectedSlot.start,
            appointmentDate: formattedAppointmentDate,
            appointmentTime: formattedAppointmentTime,
            appointmentTimezone: patientTimezone,
            appointmentTimezoneAbbr: tzAbbr,
            doctorName: doctorName,
          })
        );

        router.push('/patient/signup/summary');
      } else {
        alert('Failed to schedule appointment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to schedule:', error);
      alert('An error occurred');
      setLoading(false);
    }
  };


  // Format time slot for display (convert 24h to 12h format)
  const formatTimeSlot = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Group slots by time of day
  const groupSlotsByTimeOfDay = (slots: Slot[]) => {
    const morning: Slot[] = [];
    const afternoon: Slot[] = [];
    const evening: Slot[] = [];

    slots.forEach((slot) => {
      const [hours] = slot.time.split(':').map(Number);
      if (hours < 12) {
        morning.push(slot);
      } else if (hours < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  if (pageLoading) {
    return (
      <>
        <title>Schedule Appointment - Book Appointment - Care Calendar</title>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading available dates...</p>
          </div>
        </div>
      </>
    );
  }

  const { morning, afternoon, evening } = groupSlotsByTimeOfDay(slots);
  const selectedDateObj = days.find((d) => d.date === selectedDate);
  // Format date using the selected date string (YYYY-MM-DD format) in patient's timezone
  const formattedDate = selectedDate
    ? dayjs.tz(selectedDate, patientTimezone).format('dddd, MMMM D, YYYY')
    : '';

  return (
    <>
      <title>Schedule Appointment - Book Appointment - Care Calendar</title>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Consultation</h2>
      <p className="text-gray-600 mb-6">
        Select a date and time for your appointment. Times shown in {patientTimezone.split('/').pop()?.replace('_', ' ')} timezone.
      </p>

      {/* Select Day */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Select a day</h3>
        {days.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">No available dates at this time. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {days.map((day) => (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                disabled={!day.isAvailable}
                className={`p-3 border-2 rounded-lg text-center transition ${
                  !day.isAvailable
                    ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : selectedDate === day.date
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-200 hover:border-green-500 text-gray-900'
                }`}
              >
                <div className="text-sm font-semibold">{day.dayLabel}</div>
                <div className="text-xs">{dayjs(day.date).format('MMM D')}</div>
                {day.isAvailable && (
                  <div className="text-xs mt-1 opacity-75">Available</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Select Time */}
      {selectedDate && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Select a time</h3>

          {slotsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading available times...</p>
              </div>
            </div>
          ) : slots.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">No available time slots for this date. Please select another date.</p>
            </div>
          ) : (
            <>
              {/* Morning */}
              {morning.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Morning</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {morning.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-2 border-2 rounded-md text-sm transition ${
                          !slot.isAvailable
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : selectedSlot?.time === slot.time
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-200 hover:border-green-500 text-gray-900'
                        }`}
                      >
                        {formatTimeSlot(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon */}
              {afternoon.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Afternoon</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {afternoon.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-2 border-2 rounded-md text-sm transition ${
                          !slot.isAvailable
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : selectedSlot?.time === slot.time
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-200 hover:border-green-500 text-gray-900'
                        }`}
                      >
                        {formatTimeSlot(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evening */}
              {evening.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Evening</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {evening.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-2 border-2 rounded-md text-sm transition ${
                          !slot.isAvailable
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : selectedSlot?.time === slot.time
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-gray-200 hover:border-green-500 text-gray-900'
                        }`}
                      >
                        {formatTimeSlot(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedSlot && selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Your appointment is set for:{' '}
            <span className="font-semibold">
              {formattedDate} at {formatTimeSlot(selectedSlot.time)}
            </span>
            {' '}
            <span className="text-gray-500">
              ({dayjs(selectedSlot.start).tz(patientTimezone).format('z')})
            </span>
          </p>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={() => router.push('/patient/signup')}
          className="px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedSlot || !selectedSlot.isAvailable || loading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Scheduling...' : 'Continue to Summary'}
        </button>
      </div>
    </>
  );
}

