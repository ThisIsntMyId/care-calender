import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ==================== ADMINS TABLE ====================
export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==================== DOCTORS TABLE ====================
export const doctors = sqliteTable('doctors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  bio: text('bio'),
  qualifications: text('qualifications').notNull(),
  timezone: text('timezone').notNull(), // e.g., "America/New_York"
  
  // JSON column: array of category IDs [1, 3, 5]
  categories: text('categories', { mode: 'json' }).notNull().$type<number[]>(),
  
  // status: 'in_review' | 'active' | 'declined' | 'suspended'
  status: text('status').notNull().default('in_review'),
  isOnline: integer('is_online', { mode: 'boolean' }).notNull().default(false),

  // appointment_link: the link to the appointment
  appointmentLink: text('appointment_link'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==================== DOCTOR BUSINESS HOURS TABLE ====================
export const doctorBusinessHours = sqliteTable('doctor_business_hours', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text('start_time').notNull(), // "09:00"
  endTime: text('end_time').notNull(), // "17:00"
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==================== DOCTOR TIME OFF TABLE ====================
export const doctorTimeOff = sqliteTable('doctor_time_off', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  doctorId: integer('doctor_id').notNull().references(() => doctors.id, { onDelete: 'cascade' }),
  startDateTime: integer('start_date_time', { mode: 'timestamp' }).notNull(), // UTC timestamp
  endDateTime: integer('end_date_time', { mode: 'timestamp' }).notNull(), // UTC timestamp
  reason: text('reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==================== PATIENTS TABLE ====================
export const patients = sqliteTable('patients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  timezone: text('timezone').notNull(), // e.g., "America/New_York"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==================== CATEGORIES TABLE ====================
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(15),
  requiresAppointment: integer('requires_appointment', { mode: 'boolean' }).notNull().default(true),
  price: real('price').notNull(),
  bufferMinutes: integer('buffer_minutes').notNull().default(0), // Buffer time between appointments
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ==================== TASKS TABLE (with appointment fields) ====================
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  patientId: integer('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  doctorId: integer('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  
  // Existing task fields
  type: text('type'), // Service type (different from category)
  tag: text('tag'), // 'new' | 'followup' | 'evaluation' | 'appointment'
  
  // status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  status: text('status').notNull().default('pending'),
  
  // payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed'
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  
  // Appointment-specific fields (nullable - only set if category requires appointment)
  appointmentStartAt: integer('appointment_start_at', { mode: 'timestamp' }), // UTC timestamp
  appointmentEndAt: integer('appointment_end_at', { mode: 'timestamp' }), // UTC timestamp
  reservedUntil: integer('reserved_until', { mode: 'timestamp' }), // UTC timestamp - for payment timeout
  
  // appointment_status: 'reserved' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  appointmentStatus: text('appointment_status'),

  // appointment_link: the link to the appointment
  appointmentLink: text('appointment_link'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

