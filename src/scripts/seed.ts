import 'dotenv/config';
import { db } from '../db';
import {
  admins,
  doctors,
  patients,
  categories,
  doctorBusinessHours,
  doctorCategoryAssignments,
  tasks,
  doctorTimeOff,
} from '../db/schema';

async function truncateDatabase() {
  console.log('🗑️  Truncating database...');
  
  // Delete in order to respect foreign key constraints
  await db.delete(tasks);
  await db.delete(doctorCategoryAssignments);
  await db.delete(doctorBusinessHours);
  await db.delete(doctorTimeOff);
  await db.delete(doctors);
  await db.delete(patients);
  await db.delete(categories);
  await db.delete(admins);
  
  console.log('✅ Database truncated successfully');
}

async function seedAdmins() {
  console.log('👤 Creating admin user...');
  
  await db.insert(admins).values({
    name: 'Admin User',
    email: 'adm@mail.com',
  });
  
  console.log('✅ Admin created: adm@mail.com');
}

async function seedCategories() {
  console.log('📋 Creating categories...');
  
  const categoryData = [
    {
      name: 'General Consultation',
      slug: 'general-consultation',
      description: 'General health consultation and check-up',
      durationMinutes: 30,
      price: 100.0,
      bufferMinutes: 15,
    },
    {
      name: 'Mental Health',
      slug: 'mental-health',
      description: 'Mental health and wellness consultation',
      durationMinutes: 45,
      price: 150.0,
      bufferMinutes: 15,
    },
    {
      name: 'Pediatrics',
      slug: 'pediatrics',
      description: 'Child healthcare and consultation',
      durationMinutes: 30,
      price: 120.0,
      bufferMinutes: 10,
    },
    {
      name: 'Cardiology',
      slug: 'cardiology',
      description: 'Heart and cardiovascular health consultation',
      durationMinutes: 45,
      price: 200.0,
      bufferMinutes: 15,
    },
    {
      name: 'Dermatology',
      slug: 'dermatology',
      description: 'Skin health and dermatology consultation',
      durationMinutes: 20,
      price: 130.0,
      bufferMinutes: 10,
    },
    {
      name: 'Orthopedics',
      slug: 'orthopedics',
      description: 'Bone and joint health consultation',
      durationMinutes: 30,
      price: 180.0,
      bufferMinutes: 15,
    },
  ];
  
  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  
  console.log(`✅ Created ${insertedCategories.length} categories`);
  return insertedCategories;
}

async function seedPatients() {
  console.log('🏥 Creating patient user...');
  
  await db.insert(patients).values({
    name: 'Patient User',
    email: 'pat@mail.com',
    phone: '+1-555-0100',
    timezone: 'America/New_York',
  });
  
  console.log('✅ Patient created: pat@mail.com');
}

async function seedDoctors(categoryIds: number[]) {
  console.log('👨‍⚕️ Creating doctors...');
  
  // Default doctor
  const defaultDoctor = await db.insert(doctors).values({
    name: 'Dr. Default',
    email: 'doc@mail.com',
    phone: '+1-555-0200',
    bio: 'Experienced general practitioner with years of service',
    qualifications: 'MD, Board Certified',
    timezone: 'America/New_York',
    status: 'active',
    isOnline: false,
  }).returning();
  
  console.log('✅ Default doctor created: doc@mail.com');
  
  // Three additional doctors in different US timezones
  const additionalDoctors = [
    {
      name: 'Dr. Jack',
      email: 'jack@mail.com',
      phone: '+1-555-0300',
      bio: 'Specialized in mental health and wellness, dedicated to patient care',
      qualifications: 'MD, Psychiatry Board Certified',
      timezone: 'America/New_York', // Eastern Time
      status: 'active',
      isOnline: false,
      workingHours: [
        { day: 1, start: '09:00', end: '17:00' }, // Monday
        { day: 2, start: '09:00', end: '17:00' }, // Tuesday
        { day: 3, start: '09:00', end: '17:00' }, // Wednesday
        { day: 4, start: '09:00', end: '17:00' }, // Thursday
        { day: 5, start: '09:00', end: '15:00' }, // Friday
      ],
    },
    {
      name: 'Dr. Henry',
      email: 'henry@mail.com',
      phone: '+1-555-0400',
      bio: 'Expert in cardiology and internal medicine',
      qualifications: 'MD, Cardiology Board Certified',
      timezone: 'America/Chicago', // Central Time
      status: 'active',
      isOnline: false,
      workingHours: [
        { day: 1, start: '08:00', end: '16:00' }, // Monday
        { day: 2, start: '08:00', end: '16:00' }, // Tuesday
        { day: 3, start: '08:00', end: '16:00' }, // Wednesday
        { day: 4, start: '08:00', end: '16:00' }, // Thursday
        { day: 5, start: '08:00', end: '14:00' }, // Friday
      ],
    },
    {
      name: 'Dr. Kenny',
      email: 'kenny@mail.com',
      phone: '+1-555-0500',
      bio: 'Pediatric specialist with a gentle approach to children\'s healthcare',
      qualifications: 'MD, Pediatrics Board Certified',
      timezone: 'America/Los_Angeles', // Pacific Time
      status: 'active',
      isOnline: false,
      workingHours: [
        { day: 1, start: '10:00', end: '18:00' }, // Monday
        { day: 2, start: '10:00', end: '18:00' }, // Tuesday
        { day: 3, start: '10:00', end: '18:00' }, // Wednesday
        { day: 4, start: '10:00', end: '18:00' }, // Thursday
        { day: 5, start: '10:00', end: '16:00' }, // Friday
      ],
    },
  ];
  
  const createdDoctors = [];
  
  // Insert doctors and their business hours
  for (const doctorData of additionalDoctors) {
    const { workingHours, ...doctorInfo } = doctorData;
    
    const [insertedDoctor] = await db.insert(doctors).values(doctorInfo).returning();
    
    // Insert business hours
    if (workingHours && workingHours.length > 0) {
      await db.insert(doctorBusinessHours).values(
        workingHours.map((wh) => ({
          doctorId: insertedDoctor.id,
          dayOfWeek: wh.day,
          startTime: wh.start,
          endTime: wh.end,
          isEnabled: true,
        }))
      );
    }
    
    createdDoctors.push(insertedDoctor);
    console.log(`✅ Doctor created: ${doctorData.email} (${doctorData.timezone})`);
  }
  
  // Set default business hours for default doctor (Mon-Fri, 9-5 ET)
  await db.insert(doctorBusinessHours).values([
    { doctorId: defaultDoctor[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Monday
    { doctorId: defaultDoctor[0].id, dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Tuesday
    { doctorId: defaultDoctor[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Wednesday
    { doctorId: defaultDoctor[0].id, dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Thursday
    { doctorId: defaultDoctor[0].id, dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isEnabled: true }, // Friday
  ]);
  
  return [defaultDoctor[0], ...createdDoctors];
}

async function assignDoctorsToCategories(doctors: { id: number; email: string }[], categoryIds: number[]) {
  console.log('🔗 Assigning doctors to categories...');
  
  // Assign all doctors to all categories
  const assignments = [];
  
  for (const doctor of doctors) {
    for (const categoryId of categoryIds) {
      assignments.push({
        doctorId: doctor.id,
        categoryId,
        priority: 100,
        weight: 50,
        roundRobinIndex: 0,
      });
    }
  }
  
  await db.insert(doctorCategoryAssignments).values(assignments);
  
  console.log(`✅ Assigned ${doctors.length} doctors to ${categoryIds.length} categories`);
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Truncate existing data
    await truncateDatabase();
    console.log();
    
    // Seed admins
    await seedAdmins();
    console.log();
    
    // Seed categories
    const categories = await seedCategories();
    const categoryIds = categories.map((c) => c.id);
    console.log();
    
    // Seed patients
    await seedPatients();
    console.log();
    
    // Seed doctors (including business hours)
    const doctors = await seedDoctors(categoryIds);
    console.log();
    
    // Assign doctors to categories
    await assignDoctorsToCategories(doctors, categoryIds);
    console.log();
    
    console.log('✨ Seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Admin: adm@mail.com');
    console.log('  - Patient: pat@mail.com');
    console.log('  - Doctors:');
    console.log('    • doc@mail.com (Default - Eastern Time)');
    console.log('    • jack@mail.com (Eastern Time)');
    console.log('    • henry@mail.com (Central Time)');
    console.log('    • kenny@mail.com (Pacific Time)');
    console.log(`  - Categories: ${categories.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close database connection if needed
    process.exit(0);
  }
}

main();
