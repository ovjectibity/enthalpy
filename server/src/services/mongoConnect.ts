import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

console.log('CWD:', process.cwd());
console.log('Looking for .env at:', path.resolve(process.cwd(), '.env'));

export class MongoDBConnections {
  private static connection: mongoose.Connection;

  static async initializeConnection() {
    try {
      dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

      const mongoUri = process.env.MONGODB_URI ||
        `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || '27017'}/assets?authSource=admin`;

      console.log("Initializing MongoDB connection with URI:", mongoUri.replace(/\/\/.*@/, '//***:***@'));

      await mongoose.connect(mongoUri);

      this.connection = mongoose.connection;

      this.connection.on('connected', () => {
        console.log('MongoDB connected successfully');
      });

      this.connection.on('error', (err: Error) => {
        console.error('MongoDB connection error:', err);
      });

      this.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

    } catch (error) {
      console.error('Failed to initialize MongoDB connection:', error);
      throw error;
    }
  }

  static getConnection(): mongoose.Connection {
    if (!this.connection) {
      throw new Error("MongoDB connection not initialized");
    }
    return this.connection;
  }

  static async closeConnection() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }
}
