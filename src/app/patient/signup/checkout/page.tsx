'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientCheckoutPage() {
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

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear signup data
    localStorage.removeItem('patient_signup_data');

    // Redirect to dashboard
    router.push('/patient/dashboard');
  };

  if (!signupData) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment</h2>
      <p className="text-gray-600 mb-6">Complete your booking</p>

      {/* Appointment Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium text-gray-900">{signupData.categoryName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date & Time:</span>
            <span className="font-medium text-gray-900">
              {signupData.selectedDate} at {signupData.selectedTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Doctor:</span>
            <span className="font-medium text-gray-900">{signupData.doctorName}</span>
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="font-bold text-green-600 text-lg">
              ${signupData.categoryPrice}.00
            </span>
          </div>
        </div>
      </div>

      {/* Mock Payment Form */}
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <input
              type="text"
              placeholder="MM/YY"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
            <input
              type="text"
              placeholder="123"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => router.push('/patient/signup/summary')}
            className="px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          >
            Pay ${signupData.categoryPrice}.00
          </button>
        </div>
      </form>
    </>
  );
}

