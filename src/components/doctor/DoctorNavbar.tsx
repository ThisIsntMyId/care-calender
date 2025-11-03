interface DoctorNavbarProps {
  doctor: {
    name: string;
    status: string;
    isOnline: boolean;
    hasBusinessHours?: boolean;
    upcomingTimeOff?: any[];
  };
  onLogout: () => void;
  onToggleOnline?: (isOnline: boolean) => void;
}

const statusColors = {
  in_review: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
} as const;

const statusLabels = {
  in_review: 'Under Review',
  active: 'Active',
  declined: 'Declined',
  suspended: 'Suspended',
} as const;

export function DoctorNavbar({ doctor, onLogout, onToggleOnline }: DoctorNavbarProps) {
  const handleToggleOnline = async (checked: boolean) => {
    if (onToggleOnline) {
      onToggleOnline(checked);
    }
  };

  return (
    <div className="bg-white shadow-md mb-6">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your appointments and availability</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Status Badge */}
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                statusColors[doctor.status as keyof typeof statusColors] ||
                'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabels[doctor.status as keyof typeof statusLabels] || doctor.status}
            </span>

            {/* Doctor Info */}
            <div className="text-right">
              <p className="font-medium text-gray-900">{doctor.name}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    doctor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {doctor.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Profile & Logout Buttons */}
            <div className="flex gap-2">
              <a
                href="/doctor/profile"
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition"
              >
                Profile
              </a>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Alerts & Status Messages */}
        <div className="space-y-3 mt-4">
          {/* Business Hours Alert */}
          {!doctor.hasBusinessHours && doctor.status === 'in_review' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📅 Business Hours Pending</strong>
                <br />
                Please add your business hours in your{' '}
                <a href="/doctor/profile" className="underline font-medium">
                  profile
                </a>{' '}
                so your application can be approved.
              </p>
            </div>
          )}

          {/* Upcoming Time Off Alert */}
          {doctor.upcomingTimeOff && doctor.upcomingTimeOff.length > 0 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>🏖️ Upcoming Time Off</strong>
                <br />
                You have {doctor.upcomingTimeOff.length} scheduled time off period(s).{' '}
                <a href="/doctor/timeoff" className="underline font-medium">
                  View details
                </a>
              </p>
            </div>
          )}

          {/* Status Messages */}
          {doctor.status === 'in_review' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Your application is under review</strong>
                <br />
                You'll be notified once approved by an administrator. Please check back later.
              </p>
            </div>
          )}

          {doctor.status === 'declined' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>❌ Your application has been declined</strong>
                <br />
                Please contact support for more information.
              </p>
            </div>
          )}

          {doctor.status === 'suspended' && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-800">
                <strong>🚫 Your account has been suspended</strong>
                <br />
                Please contact support to resolve this issue.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

