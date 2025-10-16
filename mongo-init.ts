#!/usr/bin/env ts-node

import { MongoDBInitializer } from './server/src/services/mongoInit.js';

async function main() {
  const command = process.argv[2] || 'init';

  console.log('MongoDB Initialization Script');
  console.log('============================');

  try {
    switch (command.toLowerCase()) {
      case 'init':
        console.log('Initializing MongoDB with sample data...');
        await MongoDBInitializer.initializeDatabase();
        console.log('✅ MongoDB initialization completed successfully!');
        break;

      case 'reset':
        console.log('Resetting MongoDB database...');
        await MongoDBInitializer.resetDatabase();
        console.log('✅ MongoDB reset completed successfully!');
        break;

      case 'stats':
        console.log('Fetching database statistics...');
        const stats = await MongoDBInitializer.getDatabaseStats();
        console.log('\n📊 Database Statistics:');
        console.log('=======================');
        console.log(`Database: ${stats.database.name}`);
        console.log(`Collections: ${stats.database.collections}`);
        console.log(`Data Size: ${(stats.database.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Storage Size: ${(stats.database.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Total Indexes: ${stats.database.indexes}`);
        console.log('\n📋 Threads Collection:');
        console.log('======================');
        console.log(`Documents: ${stats.threads_collection.documents}`);
        console.log(`Avg Document Size: ${stats.threads_collection.avgObjSize} bytes`);
        console.log(`Data Size: ${(stats.threads_collection.dataSize / 1024).toFixed(2)} KB`);
        console.log(`Storage Size: ${(stats.threads_collection.storageSize / 1024).toFixed(2)} KB`);
        console.log(`Indexes: ${stats.threads_collection.indexes}`);
        break;

      case 'check':
        console.log('Checking MongoDB connection...');
        const isConnected = await MongoDBInitializer.checkConnection();
        if (isConnected) {
          console.log('✅ MongoDB connection successful!');
        } else {
          console.log('❌ MongoDB connection failed!');
          process.exit(1);
        }
        break;

      case 'help':
      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

function printHelp() {
  console.log('\n🔧 MongoDB Initialization Script Usage:');
  console.log('=======================================');
  console.log('npm run mongo-init [command]');
  console.log('');
  console.log('Commands:');
  console.log('  init    - Initialize database with sample threads data (default)');
  console.log('  reset   - Drop existing data and reinitialize with sample data');
  console.log('  stats   - Display database and collection statistics');
  console.log('  check   - Test MongoDB connection');
  console.log('  help    - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run mongo-init init');
  console.log('  npm run mongo-init reset');
  console.log('  npm run mongo-init stats');
  console.log('  npm run mongo-init check');
  console.log('');
  console.log('Environment Variables Required:');
  console.log('  MONGO_INITDB_ROOT_USERNAME - MongoDB root username');
  console.log('  MONGO_INITDB_ROOT_PASSWORD - MongoDB root password');
  console.log('  MONGO_HOST                 - MongoDB host (default: localhost)');
  console.log('  MONGO_PORT                 - MongoDB port (default: 27017)');
  console.log('  MONGODB_URI                - Complete MongoDB URI (optional)');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
main();
