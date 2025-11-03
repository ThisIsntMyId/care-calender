'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PatientInfoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    // Get existing data from localStorage
    const existingData = JSON.parse(localStorage.getItem('patient_signup_data') || '{}');

    // Merge and save
    localStorage.setItem('patient_signup_data', JSON.stringify({
      ...existingData,
      ...formData,
    }));

    router.push('/patient/signup/book');
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
      <p className="text-gray-600 mb-6">Tell us about yourself</p>

      <form onSubmit={handleContinue} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
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
            required
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
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => router.push('/patient/signup')}
            className="px-6 py-2 border border-gray-300 text-gray-900 rounded-md hover:bg-gray-50 transition font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          >
            Continue
          </button>
        </div>
      </form>
    </>
  );
}

