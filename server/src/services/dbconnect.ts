import { Pool } from "pg";
import dotenv from 'dotenv';
import path from 'path';

console.log('CWD:', process.cwd());
console.log('Looking for .env at:', path.resolve(process.cwd(), '.env'));

export class DatabaseConnections {
  private static commonPool: Pool;

  static initializePools() {
    // Common database pool
    dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
    console.log("Initialising DB pool with these params: ",
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      process.env.DB_HOST,
      process.env.DB_PORT,
      process.env.DB_NAME);
    this.commonPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  static getDBPool(): Pool {
    if (!this.commonPool) {
      throw new Error("Database pool not initialized");
    }
    return this.commonPool;
  }

  static async closeAllConnections() {
    await Promise.all([this.commonPool?.end()]);
  }
}
