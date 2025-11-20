import 'dotenv/config';
import { db } from '../db';
import { admins, doctors, patients, categories } from '../db/schema';

async function hello() {
  try {
    console.log('👋 Hello! Testing database connection...\n');
    
    // Test query: count records in each table
    const adminCount = await db.select().from(admins);
    const doctorCount = await db.select().from(doctors);
    const patientCount = await db.select().from(patients);
    const categoryCount = await db.select().from(categories);
    
    console.log('📊 Database Summary:');
    console.log(`  - Admins: ${adminCount.length}`);
    console.log(`  - Doctors: ${doctorCount.length}`);
    console.log(`  - Patients: ${patientCount.length}`);
    console.log(`  - Categories: ${categoryCount.length}`);
    
    if (adminCount.length > 0) {
      console.log('\n👤 Admins:');
      adminCount.forEach((admin) => {
        console.log(`  - ${admin.name} (${admin.email})`);
      });
    }
    
    if (doctorCount.length > 0) {
      console.log('\n👨‍⚕️ Doctors:');
      doctorCount.forEach((doctor) => {
        console.log(`  - ${doctor.name} (${doctor.email}) - ${doctor.timezone} - Status: ${doctor.status}`);
      });
    }
    
    if (patientCount.length > 0) {
      console.log('\n🏥 Patients:');
      patientCount.forEach((patient) => {
        console.log(`  - ${patient.name} (${patient.email})`);
      });
    }
    
    if (categoryCount.length > 0) {
      console.log('\n📋 Categories:');
      categoryCount.forEach((category) => {
        console.log(`  - ${category.name} (${category.slug}) - $${category.price}`);
      });
    }
    
    console.log('\n✅ Script is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

hello();
