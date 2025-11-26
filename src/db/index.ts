import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Get database connection string from environment
// For local: postgresql://user:password@localhost:5432/dbname
// For Neon: postgresql://user:password@host.neon.tech/dbname?sslmode=require
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 1, // Limit connection pool for serverless environments
});

// Create Drizzle instance
export const db = drizzle(client);
