'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthenticated } from '@/lib/auth/client';

export default function AdminTaskViewPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    status: '',
    paymentStatus: '',
    appointmentStatus: '',
    appointmentStartAt: '',
    appointmentEndAt: '',
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    fetchTask();
    fetchDoctors();
  }, [router, taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data);
        setFormData({
          doctorId: data.doctorId || '',
          status: data.status || '',
          paymentStatus: data.paymentStatus || '',
          appointmentStatus: data.appointmentStatus || '',
          appointmentStartAt: data.appointmentStartAt
            ? new Date(data.appointmentStartAt).toISOString().slice(0, 16)
            : '',
          appointmentEndAt: data.appointmentEndAt
            ? new Date(data.appointmentEndAt).toISOString().slice(0, 16)
            : '',
        });
      } else {
        router.push('/admin/tasks');
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      router.push('/admin/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/admin/doctors');
      if (response.ok) {
        const data = await response.json();
        setAllDoctors(data.filter((d: any) => d.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {};
      
      if (formData.doctorId !== task.doctorId) {
        updateData.doctorId = formData.doctorId || null;
      }
      if (formData.status !== task.status) {
        updateData.status = formData.status;
      }
      if (formData.paymentStatus !== task.paymentStatus) {
        updateData.paymentStatus = formData.paymentStatus;
      }
      if (formData.appointmentStatus !== task.appointmentStatus) {
        updateData.appointmentStatus = formData.appointmentStatus;
      }
      if (formData.appointmentStartAt !== (task.appointmentStartAt ? new Date(task.appointmentStartAt).toISOString().slice(0, 16) : '')) {
        updateData.appointmentStartAt = formData.appointmentStartAt || null;
      }
      if (formData.appointmentEndAt !== (task.appointmentEndAt ? new Date(task.appointmentEndAt).toISOString().slice(0, 16) : '')) {
        updateData.appointmentEndAt = formData.appointmentEndAt || null;
      }

      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        alert('Task updated successfully!');
        await fetchTask();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Task deleted successfully!');
        router.push('/admin/tasks');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('An error occurred');
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!task) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <title>Task Details - Admin - Care Calendar</title>
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/tasks"
              className="text-sm text-green-600 hover:text-green-700 font-medium mb-2 inline-block"
            >
              ← Back to Tasks List
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Task Details</h1>
            <p className="text-gray-600 mt-1">Task ID: #{task.id}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Delete Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Task Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{task.patient?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{task.patient?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{task.patient?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <p className="text-gray-900">{task.category?.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Doctor
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Unassigned</option>
                    {allDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} ({doctor.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Status
                  </label>
                  <select
                    value={formData.appointmentStatus || ''}
                    onChange={(e) => setFormData({ ...formData, appointmentStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Not Set</option>
                    <option value="reserved">Reserved</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.appointmentStartAt}
                    onChange={(e) => setFormData({ ...formData, appointmentStartAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment End
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.appointmentEndAt}
                    onChange={(e) => setFormData({ ...formData, appointmentEndAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Doctor Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Doctor Information</h2>
              {task.doctor ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{task.doctor.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{task.doctor.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No doctor assigned</p>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-gray-900">{task.type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tag</label>
                  <p className="text-gray-900">{task.tag || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{formatDate(task.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p className="text-gray-900">{formatDate(task.updatedAt)}</p>
                </div>
                {task.appointmentLink && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Appointment Link</label>
                    <a
                      href={task.appointmentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 break-all"
                    >
                      {task.appointmentLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

