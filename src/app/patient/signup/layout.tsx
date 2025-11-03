'use client';

import { usePathname } from 'next/navigation';

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const steps = [
    { number: 1, label: 'Category', path: '/patient/signup' },
    { number: 2, label: 'Info', path: '/patient/signup/info' },
    { number: 3, label: 'Schedule', path: '/patient/signup/book' },
    { number: 4, label: 'Summary', path: '/patient/signup/summary' },
    { number: 5, label: 'Payment', path: '/patient/signup/checkout' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.path === pathname);
  const currentStep = currentStepIndex + 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= s.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s.number}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 ${currentStep > s.number ? 'bg-green-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2">
            {steps.map((s) => (
              <span
                key={s.number}
                className={`text-sm ${
                  currentStep >= s.number ? 'text-green-600 font-medium' : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">{children}</div>
      </div>
    </div>
  );
}

