'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPatientAuthenticated, getPatientAuth } from '@/lib/auth/client';

export default function PatientSignupCategoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    // Check if patient is already logged in
    if (isPatientAuthenticated()) {
      setIsLoggedIn(true);
      setPatient(getPatientAuth());
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('Failed to load categories. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = async (category: any) => {
    if (isLoggedIn && patient) {
      // Patient is logged in - create task directly and skip info step
      try {
        const response = await fetch('/api/patient/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: category.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('patient_signup_data', JSON.stringify({
            categoryId: category.id,
            categoryName: category.name,
            categoryPrice: category.price,
            categoryDuration: category.durationMinutes,
            taskId: data.taskId,
            ...patient,
          }));
          router.push('/patient/signup/book');
        } else {
          alert('Failed to create appointment. Please try again.');
        }
      } catch (err) {
        console.error('Failed to create task:', err);
        alert('An error occurred. Please try again.');
      }
    } else {
      // Patient not logged in - go to info step
      localStorage.setItem('patient_signup_data', JSON.stringify({
        categoryId: category.id,
        categoryName: category.name,
        categoryPrice: category.price,
        categoryDuration: category.durationMinutes,
      }));
      router.push('/patient/signup/info');
    }
  };

  if (loading) {
    return (
      <>
        <title>Select Service - Book Appointment - Care Calendar</title>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
        <p className="text-gray-600 mb-6">Choose the service you need help with</p>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <title>Select Service - Book Appointment - Care Calendar</title>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
        <p className="text-gray-600 mb-6">Choose the service you need help with</p>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchCategories}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </>
    );
  }

  if (categories.length === 0) {
    return (
      <>
        <title>Select Service - Book Appointment - Care Calendar</title>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
        <p className="text-gray-600 mb-6">Choose the service you need help with</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">No services are currently available. Please check back later.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Select Service - Book Appointment - Care Calendar</title>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Service</h2>
      <p className="text-gray-600 mb-6">Choose the service you need help with</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelectCategory(category)}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {category.name}
            </h3>
            {category.description && (
              <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>${category.price}</span>
              <span>{category.durationMinutes} minutes</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
