'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientSummaryPage() {
  const router = useRouter();
  const [signupData, setSignupData] = useState<any>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('patient_signup_data') || '{}');
    if (!data.categoryId || !data.name || !data.selectedDate) {
      router.push('/patient/signup');
      return;
    }
    setSignupData(data);
  }, [router]);

  if (!signupData) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Summary</h2>
      <p className="text-gray-600 mb-6">Review your appointment details</p>

      <div className="space-y-6">
        {/* Service Details Card */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
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
            Service Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium text-gray-900">{signupData.categoryName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">{signupData.categoryDuration} minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium text-gray-900">${signupData.categoryPrice}</span>
            </div>
          </div>
        </div>

        {/* Appointment Details Card */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
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
            Appointment Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                Monday, {signupData.selectedDate}, 2025
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-900">{signupData.selectedTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Doctor:</span>
              <span className="font-medium text-gray-900">{signupData.doctorName}</span>
            </div>
          </div>
        </div>

        {/* Patient Details Card */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
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
            Patient Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{signupData.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{signupData.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium text-gray-900">{signupData.phone}</span>
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              ${signupData.categoryPrice}.00
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={() => router.push('/patient/signup/book')}
          className="px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
        >
          Back
        </button>
        <button
          onClick={() => router.push('/patient/signup/checkout')}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
        >
          Proceed to Payment
        </button>
      </div>
    </>
  );
}

