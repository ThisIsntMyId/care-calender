'use client';

import { useRouter } from 'next/navigation';

export default function PatientSignupCategoryPage() {
  const router = useRouter();

  const categories = [
    { id: 1, name: 'Weight Loss', price: 50, duration: 30 },
    { id: 2, name: 'Hair Loss', price: 45, duration: 30 },
    { id: 3, name: 'Skin Care', price: 60, duration: 45 },
    { id: 4, name: 'Acne Treatment', price: 55, duration: 30 },
  ];

  const handleSelectCategory = (category: any) => {
    // Store in localStorage for now (we'll make it dynamic later)
    localStorage.setItem('patient_signup_data', JSON.stringify({
      categoryId: category.id,
      categoryName: category.name,
      categoryPrice: category.price,
      categoryDuration: category.duration,
    }));
    router.push('/patient/signup/info');
  };

  return (
    <>
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
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>${category.price}</span>
              <span>{category.duration} minutes</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
