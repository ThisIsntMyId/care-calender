'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientBookPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('Nov 3');
  const [selectedTime, setSelectedTime] = useState('');

  const days = [
    { date: 'Nov 3', day: 'Today', available: 19 },
    { date: 'Nov 4', day: 'Tomorrow', available: 25 },
    { date: 'Nov 5', day: 'Wed', available: 36 },
    { date: 'Nov 6', day: 'Thu', available: 31 },
    { date: 'Nov 7', day: 'Fri', available: 11 },
    { date: 'Nov 8', day: 'Sat', available: 30 },
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

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time');
      return;
    }

    // Get existing data from localStorage
    const existingData = JSON.parse(localStorage.getItem('patient_signup_data') || '{}');

    // Merge and save
    localStorage.setItem(
      'patient_signup_data',
      JSON.stringify({
        ...existingData,
        selectedDate,
        selectedTime,
        doctorName: 'Dr. John Smith', // Mock - will be assigned by algorithm
      })
    );

    router.push('/patient/signup/summary');
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Consultation</h2>
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
          onClick={() => router.push('/patient/signup/info')}
          className="px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue to Summary
        </button>
      </div>
    </>
  );
}

