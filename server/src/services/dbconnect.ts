import { Pool } from "pg";

export class DatabaseConnections {
  private static commonPool: Pool;
  private static assetsPool: Pool;

  static initializePools() {
    // Common database pool
    this.commonPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: "common",
      max: 20,
      idleTimeoutMillis: 30000,
    });

    // Assets database pool
    this.assetsPool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: "assets",
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  static getCommonPool(): Pool {
    if (!this.commonPool) {
      throw new Error("Common database pool not initialized");
    }
    return this.commonPool;
  }

  static getAssetsPool(): Pool {
    if (!this.assetsPool) {
      throw new Error("Assets database pool not initialized");
    }
    return this.assetsPool;
  }

  static async closeAllConnections() {
    await Promise.all([this.commonPool?.end(), this.assetsPool?.end()]);
  }
}
