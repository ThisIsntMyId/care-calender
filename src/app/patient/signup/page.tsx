'use client';

import { useState } from 'react';

export default function PatientSignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    categoryId: 0,
    categoryName: '',
    categoryPrice: 0,
    categoryDuration: 0,
    name: '',
    email: '',
    phone: '',
    selectedDate: '',
    selectedTime: '',
    doctorName: 'Dr. John Smith', // Mock - will be assigned by algorithm
  });

  const categories = [
    { id: 1, name: 'Weight Loss', price: 50, duration: 30 },
    { id: 2, name: 'Hair Loss', price: 45, duration: 30 },
    { id: 3, name: 'Skin Care', price: 60, duration: 45 },
    { id: 4, name: 'Acne Treatment', price: 55, duration: 30 },
  ];

  const days = [
    { date: 'Nov 3', day: 'Today', available: 19 },
    { date: 'Nov 4', day: 'Tomorrow', available: 25 },
    { date: 'Nov 5', day: 'Wed', available: 36 },
    { date: 'Nov 6', day: 'Thu', available: 31 },
    { date: 'Nov 7', day: 'Fri', available: 11 },
    { date: 'Nov 8', day: 'Sat', available: 30 },
  ];

  const morningSlots = ['9:00 AM', '9:15 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'];
  const afternoonSlots = ['1:00 PM', '1:30 PM', '2:00 PM', '2:15 PM', '2:45 PM', '3:30 PM', '4:00 PM'];
  const eveningSlots = ['5:00 PM', '5:15 PM', '5:45 PM', '6:00 PM', '6:30 PM'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3, 4, 5].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {idx < 4 && (
                  <div
                    className={`w-12 h-1 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2">
            <span className={`text-sm ${step >= 1 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
              Category
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
              Info
            </span>
            <span className={`text-sm ${step >= 3 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
              Schedule
            </span>
            <span className={`text-sm ${step >= 4 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
              Summary
            </span>
            <span className={`text-sm ${step >= 5 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
              Payment
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Step 1: Select Category */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
              <p className="text-gray-600 mb-6">Choose the service you need help with</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        categoryId: category.id,
                        categoryName: category.name,
                        categoryPrice: category.price,
                        categoryDuration: category.duration,
                      });
                      setStep(2);
                    }}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>${category.price}</span>
                      <span>{category.duration} minutes</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Patient Information */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
              <p className="text-gray-600 mb-6">Tell us about yourself</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
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
                    placeholder="+1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Schedule Appointment */}
          {step === 3 && (
            <div>
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
                      onClick={() => setFormData({ ...formData, selectedDate: day.date })}
                      className={`p-3 border-2 rounded-lg text-center transition ${
                        formData.selectedDate === day.date
                          ? 'border-green-600 bg-green-600 text-white'
                          : 'border-gray-200 hover:border-green-500'
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
              {formData.selectedDate && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Select a time</h3>

                  {/* Morning */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Morning</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {morningSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setFormData({ ...formData, selectedTime: time })}
                          className={`p-2 border-2 rounded-md text-sm transition ${
                            formData.selectedTime === time
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-gray-200 hover:border-green-500'
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
                          onClick={() => setFormData({ ...formData, selectedTime: time })}
                          className={`p-2 border-2 rounded-md text-sm transition ${
                            formData.selectedTime === time
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-gray-200 hover:border-green-500'
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
                          onClick={() => setFormData({ ...formData, selectedTime: time })}
                          className={`p-2 border-2 rounded-md text-sm transition ${
                            formData.selectedTime === time
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-gray-200 hover:border-green-500'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formData.selectedTime && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Your appointment is set for: <span className="font-semibold">Monday, {formData.selectedDate}, 2025 at {formData.selectedTime}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!formData.selectedDate || !formData.selectedTime}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue to Summary
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div>
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
                      <span className="font-medium text-gray-900">{formData.categoryName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">{formData.categoryDuration} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">${formData.categoryPrice}</span>
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
                      <span className="font-medium text-gray-900">Monday, {formData.selectedDate}, 2025</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-900">{formData.selectedTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="font-medium text-gray-900">{formData.doctorName}</span>
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
                      <span className="font-medium text-gray-900">{formData.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{formData.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{formData.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Total Card */}
                <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">${formData.categoryPrice}.00</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment</h2>
              <p className="text-gray-600 mb-6">Complete your booking</p>

              {/* Appointment Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium text-gray-900">{formData.categoryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium text-gray-900">
                      {formData.selectedDate} at {formData.selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium text-gray-900">{formData.doctorName}</span>
                  </div>
                  <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-600 text-lg">${formData.categoryPrice}.00</span>
                  </div>
                </div>
              </div>

              {/* Mock Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => alert('Payment processed! Redirecting to dashboard...')}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                >
                  Pay ${formData.categoryPrice}.00
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

