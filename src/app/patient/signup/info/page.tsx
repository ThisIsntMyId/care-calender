'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPatientAuthenticated, getPatientAuth } from '@/lib/auth/client';
// UPDATE: Import the new guess detection function
import { getTimezoneOptions, guessUserTimezone } from '@/lib/timezones';

export default function PatientInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [timezoneOptions, setTimezoneOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: '',
  });

  useEffect(() => {
    // Get timezone options
    const options = getTimezoneOptions();
    setTimezoneOptions(options);
    
    // Helper to safely get a valid timezone or fallback
    const getValidTimezone = (preferredTz: string | null) => {
      if (preferredTz && options.some(opt => opt.value === preferredTz)) {
        return preferredTz;
      }
      // Fallback to NY or first option
      return options.find(opt => opt.value === 'America/New_York')?.value || options[0]?.value || 'America/New_York';
    };

    // Check if patient is already logged in
    if (isPatientAuthenticated()) {
      const patient = getPatientAuth();
      setIsLoggedIn(true);
      
      // Pre-fill form with patient data
      fetch('/api/patient/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            // 1. Try DB timezone, 2. Try robust browser detection
            let timezoneToUse = data.timezone;
            
            if (!timezoneToUse && typeof window !== 'undefined') {
              // UPDATE: Use the normalized guess function
              timezoneToUse = guessUserTimezone(); 
            }
            
            setFormData({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              timezone: getValidTimezone(timezoneToUse),
            });
          }
        })
        .catch((err) => console.error('Failed to fetch profile:', err));
    } else {
      // Auto-detect timezone for new signups on client side
      if (typeof window !== 'undefined') {
        // UPDATE: Use the normalized guess function
        const detectedTimezone = guessUserTimezone();
        
        const finalTimezone = getValidTimezone(detectedTimezone);
        
        if (finalTimezone) {
          setFormData((prev) => ({
            ...prev,
            timezone: finalTimezone,
          }));
        }
      }
    }
  }, []);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get category from localStorage
      const signupData = JSON.parse(localStorage.getItem('patient_signup_data') || '{}');

      if (!signupData.categoryId) {
        router.push('/patient/signup');
        return;
      }

      if (isLoggedIn) {
        // Patient is logged in - just create task
        const response = await fetch('/api/patient/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: signupData.categoryId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to create appointment');
          setLoading(false);
          return;
        }

        // Store task ID in localStorage
        localStorage.setItem('patient_signup_data', JSON.stringify({
          ...signupData,
          ...formData,
          taskId: data.taskId,
        }));

        router.push('/patient/signup/book');
      } else {
        // Create patient account and task
        const response = await fetch('/api/patient/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            categoryId: signupData.categoryId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Signup failed');
          setLoading(false);
          return;
        }

        // Store task ID and timezone in localStorage
        localStorage.setItem('patient_signup_data', JSON.stringify({
          ...signupData,
          ...formData,
          taskId: data.taskId,
          timezone: data.timezone,
        }));

        // Cookie is set by API, redirect to booking
        router.push('/patient/signup/book');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <title>Your Information - Book Appointment - Care Calendar</title>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Information</h2>
      <p className="text-gray-600 mb-6">
        {isLoggedIn ? 'Confirm your information' : 'Tell us about yourself'}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone *
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
          >
            {timezoneOptions.length === 0 && (
              <option value="">Loading timezones...</option>
            )}
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
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
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (isLoggedIn ? 'Creating Appointment...' : 'Creating Account...') : 'Continue'}
          </button>
        </div>
      </form>
    </>
  );
}