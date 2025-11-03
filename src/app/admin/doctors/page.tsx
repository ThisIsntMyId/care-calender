'use client';

import { useState } from 'react';

export default function AdminDoctorsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Mock data
  const doctors = [
    {
      id: 1,
      name: 'Dr. John Smith',
      email: 'john@example.com',
      phone: '+1234567890',
      qualifications: 'MD, Dermatology',
      status: 'in_review',
      categories: ['Weight Loss', 'Skin Care'],
    },
    {
      id: 2,
      name: 'Dr. Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1234567891',
      qualifications: 'MD, General Practice',
      status: 'active',
      categories: ['Hair Loss'],
    },
  ];

  const handleView = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctors Management</h1>
          <p className="text-gray-600 mt-2">Review and manage doctor applications</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{doctor.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        doctor.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : doctor.status === 'in_review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleView(doctor)}
                      className="text-green-600 hover:text-green-900 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Doctor Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{selectedDoctor.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{selectedDoctor.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{selectedDoctor.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Qualifications</label>
                <p className="text-gray-900">{selectedDoctor.qualifications}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Categories</label>
                <p className="text-gray-900">{selectedDoctor.categories.join(', ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{selectedDoctor.status}</p>
              </div>
            </div>

            {selectedDoctor.status === 'in_review' && (
              <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition">
                  Approve
                </button>
                <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition">
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

