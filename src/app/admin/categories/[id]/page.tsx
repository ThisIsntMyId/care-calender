'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/auth/client';

export default function AdminCategoryViewPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchCategory();
    fetchAssignments();
    fetchAllDoctors();
  }, [router, categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data);
      } else {
        router.push('/admin/categories');
      }
    } catch (error) {
      console.error('Failed to fetch category:', error);
      router.push('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/doctors`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const response = await fetch('/api/admin/doctors');
      if (response.ok) {
        const data = await response.json();
        setAllDoctors(data);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const handleAssign = async () => {
    if (selectedDoctorIds.length === 0) {
      alert('Please select at least one doctor');
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorIds: selectedDoctorIds }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedDoctorIds([]);
        fetchAssignments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign doctors');
      }
    } catch (error) {
      console.error('Failed to assign doctors:', error);
      alert('An error occurred');
    }
  };

  const handleRemove = async (doctorId: number) => {
    if (!confirm('Are you sure you want to remove this doctor from the category?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/categories/${categoryId}/doctors/${doctorId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        fetchAssignments();
      } else {
        alert('Failed to remove doctor');
      }
    } catch (error) {
      console.error('Failed to remove doctor:', error);
      alert('An error occurred');
    }
  };

  const handleUpdateAssignment = async (doctorId: number, priority: number, weight: number) => {
    try {
      const response = await fetch(
        `/api/admin/categories/${categoryId}/doctors/${doctorId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority, weight }),
        }
      );

      if (response.ok) {
        setEditingAssignment(null);
        fetchAssignments();
      } else {
        alert('Failed to update assignment');
      }
    } catch (error) {
      console.error('Failed to update assignment:', error);
      alert('An error occurred');
    }
  };

  const handleUpdateCategory = async (updates: any) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchCategory();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  const assignedDoctorIds = assignments.map((a) => a.doctorId);
  const availableDoctors = allDoctors.filter((d) => !assignedDoctorIds.includes(d.id));

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <title>Category Management - Admin - Care Calendar</title>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/categories"
            className="text-sm text-green-600 hover:text-green-700 font-medium mb-2 inline-block"
          >
            ← Back to Categories
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        </div>

        <div className="space-y-6">
          {/* Category Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900 mt-1">{category.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Slug</label>
                <p className="text-gray-900 mt-1">{category.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Price</label>
                <p className="text-gray-900 mt-1">${category.price}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <div className="mt-1">
                  <select
                    value={category.durationMinutes || 15}
                    onChange={(e) => handleUpdateCategory({ durationMinutes: parseInt(e.target.value) })}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  >
                    <option value="5" style={{ color: '#111827' }}>5 minutes</option>
                    <option value="15" style={{ color: '#111827' }}>15 minutes</option>
                    <option value="30" style={{ color: '#111827' }}>30 minutes</option>
                    <option value="45" style={{ color: '#111827' }}>45 minutes</option>
                    <option value="60" style={{ color: '#111827' }}>1 hour</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Next Days (Scheduling Window)</label>
                <div className="mt-1">
                  <select
                    value={category.nextDays || 7}
                    onChange={(e) => handleUpdateCategory({ nextDays: parseInt(e.target.value) })}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  >
                    <option value="7" style={{ color: '#111827' }}>7 days</option>
                    <option value="14" style={{ color: '#111827' }}>14 days</option>
                    <option value="30" style={{ color: '#111827' }}>30 days</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Concurrency</label>
                <div className="mt-1">
                  <input
                    type="number"
                    min="1"
                    value={category.concurrency || 1}
                    onChange={(e) => handleUpdateCategory({ concurrency: parseInt(e.target.value) || 1 })}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Concurrent bookings per doctor</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Selection Algorithm</label>
                <div className="mt-1">
                  <select
                    value={category.selectionAlgorithm || 'round_robin'}
                    onChange={(e) => handleUpdateCategory({ selectionAlgorithm: e.target.value })}
                    className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  >
                    <option value="round_robin" style={{ color: '#111827' }}>Round Robin</option>
                    <option value="priority" style={{ color: '#111827' }}>Priority</option>
                    <option value="weighted" style={{ color: '#111827' }}>Weighted</option>
                    <option value="random" style={{ color: '#111827' }}>Random</option>
                    <option value="least_recently_used" style={{ color: '#111827' }}>Least Recently Used</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={category.isActive}
                      onChange={(e) => handleUpdateCategory({ isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Active</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Doctors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Assigned Doctors</h2>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Assign Doctors
              </button>
            </div>

            {assignments.length === 0 ? (
              <p className="text-gray-500">No doctors assigned to this category</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Doctor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.doctor.name}
                          </div>
                          <div className="text-sm text-gray-500">{assignment.doctor.email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              assignment.doctor.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {assignment.doctor.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingAssignment?.id === assignment.id ? (
                            <input
                              type="number"
                              min="1"
                              value={editingAssignment.priority}
                              onChange={(e) =>
                                setEditingAssignment({
                                  ...editingAssignment,
                                  priority: parseInt(e.target.value),
                                })
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{assignment.priority}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingAssignment?.id === assignment.id ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editingAssignment.weight}
                              onChange={(e) =>
                                setEditingAssignment({
                                  ...editingAssignment,
                                  weight: parseInt(e.target.value),
                                })
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{assignment.weight}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {editingAssignment?.id === assignment.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateAssignment(
                                    assignment.doctorId,
                                    editingAssignment.priority,
                                    editingAssignment.weight
                                  )
                                }
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingAssignment(null)}
                                className="text-gray-600 hover:text-gray-900 font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingAssignment(assignment)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRemove(assignment.doctorId)}
                                className="text-red-600 hover:text-red-900 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Doctors Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assign Doctors</h2>
            {availableDoctors.length === 0 ? (
              <p className="text-gray-500">All doctors are already assigned to this category</p>
            ) : (
              <div className="space-y-2 mb-4">
                {availableDoctors.map((doctor) => (
                  <label key={doctor.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedDoctorIds.includes(doctor.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDoctorIds([...selectedDoctorIds, doctor.id]);
                        } else {
                          setSelectedDoctorIds(selectedDoctorIds.filter((id) => id !== doctor.id));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-gray-900">
                      {doctor.name} ({doctor.email})
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDoctorIds([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedDoctorIds.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

