interface PatientNavbarProps {
  patient: {
    name: string;
    email: string;
  };
  onLogout: () => void;
}

export function PatientNavbar({ patient, onLogout }: PatientNavbarProps) {
  return (
    <div className="bg-white shadow-md mb-6">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your appointments</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Patient Info */}
            <div className="text-right">
              <p className="font-medium text-gray-900">{patient.name}</p>
              <p className="text-sm text-gray-600">{patient.email}</p>
            </div>

            {/* Profile & Logout Buttons */}
            <div className="flex gap-2">
              <a
                href="/patient/profile"
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
      </div>
    </div>
  );
}

