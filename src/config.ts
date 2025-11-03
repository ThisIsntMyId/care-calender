// ==================== APPOINTMENT CONFIGURATION ====================

export const appointmentConfig = {
  // Doctor Selection Algorithm
  // Options: 'round_robin' | 'weighted_random' | 'least_busy' | 'random'
  doctorSelectionAlgorithm: 'round_robin' as const,

  // Booking Settings
  slotReservationMinutes: 15, // How long to hold slot during payment (before reserved_until expires)
  maxAdvanceBookingDays: 14, // Show next 2 weeks
  allowSameDayBooking: true, // Can patients book appointments for today?

  // Cancellation & Rescheduling
  cancellationDeadlineHours: 24, // Can't cancel within 24 hours of appointment
  rescheduleDeadlineHours: 24, // Can't reschedule within 24 hours of appointment

  // Time Slot Display Categories
  timeSlotCategories: {
    morning: {
      start: '06:00',
      end: '12:00',
      label: 'Morning',
    },
    afternoon: {
      start: '12:00',
      end: '17:00',
      label: 'Afternoon',
    },
    evening: {
      start: '17:00',
      end: '22:00',
      label: 'Evening',
    },
  },
};

