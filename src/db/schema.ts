import { pgTable, text, integer, serial, boolean, timestamp, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==================== ADMINS TABLE ====================
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== DOCTORS TABLE ====================
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  bio: text('bio'),
  qualifications: text('qualifications').notNull(),
  timezone: text('timezone').notNull(), // e.g., "America/New_York"
  
  // status: 'in_review' | 'active' | 'declined' | 'suspended'
  status: text('status').notNull().default('in_review'),
  isOnline: boolean('is_online').notNull().default(false),

  // appointment_link: the link to the appointment
  appointmentLink: text('appointment_link'),
  
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== DOCTOR BUSINESS HOURS TABLE ====================
export const doctorBusinessHours = pgTable('doctor_business_hours', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text('start_time').notNull(), // "09:00"
  endTime: text('end_time').notNull(), // "17:00"
  isEnabled: boolean('is_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== DOCTOR TIME OFF TABLE ====================
export const doctorTimeOff = pgTable('doctor_time_off', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  startDateTime: timestamp('start_date_time', { withTimezone: false }).notNull(), // UTC timestamp
  endDateTime: timestamp('end_date_time', { withTimezone: false }).notNull(), // UTC timestamp
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== PATIENTS TABLE ====================
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  timezone: text('timezone').notNull(), // e.g., "America/New_York"
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== CATEGORIES TABLE ====================
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(15), // Duration for each appointment in minutes
  requiresAppointment: boolean('requires_appointment').notNull().default(true),
  price: numeric('price').notNull(),
  bufferMinutes: integer('buffer_minutes').notNull().default(0), // Buffer time between appointments
  isActive: boolean('is_active').notNull().default(true),
  // selectionAlgorithm: 'priority' | 'weighted' | 'random' | 'least_recently_used' | 'round_robin'
  selectionAlgorithm: text('selection_algorithm').notNull().default('round_robin'),
  nextDays: integer('next_days').notNull().default(7), // How far in the future can schedule (7, 14, 30 days)
  concurrency: integer('concurrency').notNull().default(1), // How many concurrent bookings a doctor can handle (>= 1)
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== DOCTOR CATEGORY ASSIGNMENTS TABLE ====================
// Many-to-many relationship between doctors and categories
export const doctorCategoryAssignments = pgTable('doctor_category_assignments', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  // Priority for priority algorithm (lower number = higher priority)
  priority: integer('priority').notNull().default(100),
  // Weight for weighted algorithm (0-100, higher = more likely to be selected)
  weight: integer('weight').notNull().default(50),
  // Last assigned timestamp for LRU algorithm
  lastAssignedAt: timestamp('last_assigned_at', { withTimezone: false }),
  // Round robin index for round robin algorithm
  roundRobinIndex: integer('round_robin_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== TASKS TABLE ====================
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  
  // Existing task fields
  type: text('type'), // Service type (different from category)
  tag: text('tag'), // 'new' | 'followup' | 'evaluation' | 'appointment'
  
  // status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  status: text('status').notNull().default('pending'),
  
  // payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed'
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  paidAt: timestamp('paid_at', { withTimezone: false }), // UTC timestamp - when payment was completed
  
  // Payment timeout - for reserving slots during payment process
  reservedUntil: timestamp('reserved_until', { withTimezone: false }), // UTC timestamp - for payment timeout
  
  // completedAt: timestamp when the task was marked as completed
  completedAt: timestamp('completed_at', { withTimezone: false }),
  
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});

// ==================== APPOINTMENTS TABLE ====================
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  
  // Duplicated for direct appointment queries (denormalization for performance)
  patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  
  // Appointment-specific fields
  startAt: timestamp('start_at', { withTimezone: false }).notNull(), // UTC timestamp
  endAt: timestamp('end_at', { withTimezone: false }).notNull(), // UTC timestamp
  // status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  status: text('status').notNull().default('scheduled'),
  link: text('link'), // appointment_link
  
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});
