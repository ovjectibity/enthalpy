#!/usr/bin/env ts-node

import { MongoDBConnections } from './src/services/mongoConnect.js';
import { ThreadsService } from './src/services/threadsService.js';
import { MongoDBInitializer } from './src/services/mongoInit.js';

async function testMongoDB() {
  console.log('🧪 MongoDB Test Script');
  console.log('=====================');

  try {
    // Test 1: Connection
    console.log('\n1. Testing MongoDB Connection...');
    const isConnected = await MongoDBInitializer.checkConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to MongoDB');
    }
    console.log('✅ MongoDB connection successful');

    // Test 2: Database Statistics
    console.log('\n2. Getting Database Statistics...');
    const stats = await MongoDBInitializer.getDatabaseStats();
    console.log(`📊 Database: ${stats.database.name}`);
    console.log(`📋 Threads: ${stats.threads_collection.documents} documents`);

    // Test 3: Create Thread
    console.log('\n3. Testing Thread Creation...');
    const createResult = await ThreadsService.createThread({
      index: 99,
      user_id: 999,
      project_id: 999,
      role: 'user',
      message_type: 'static',
      message: 'Test message from MongoDB test script',
      agent_name: 'TestUser'
    });

    if (!createResult.success) {
      throw new Error(`Failed to create thread: ${createResult.error}`);
    }
    console.log(`✅ Thread created with ID: ${createResult.data?.id}`);
    const testThreadId = createResult.data?.id;

    // Test 4: Get Thread by ID
    console.log('\n4. Testing Get Thread by ID...');
    const getResult = await ThreadsService.getThreadById(testThreadId!);
    if (!getResult.success) {
      throw new Error(`Failed to get thread: ${getResult.error}`);
    }
    console.log(`✅ Retrieved thread: "${getResult.data?.message}"`);

    // Test 5: Update Thread
    console.log('\n5. Testing Thread Update...');
    const updateResult = await ThreadsService.updateThread(testThreadId!, {
      message: 'Updated test message',
      message_type: 'thinking'
    });
    if (!updateResult.success) {
      throw new Error(`Failed to update thread: ${updateResult.error}`);
    }
    console.log(`✅ Thread updated: "${updateResult.data?.message}"`);

    // Test 6: Get All Threads with Filter
    console.log('\n6. Testing Get Threads with Filter...');
    const getAllResult = await ThreadsService.getAllThreads({
      user_id: 999,
      project_id: 999,
      page: 1,
      limit: 5
    });
    if (!getAllResult.success) {
      throw new Error(`Failed to get threads: ${getAllResult.error}`);
    }
    console.log(`✅ Retrieved ${getAllResult.data.length} threads for user 999`);

    // Test 7: Thread Statistics
    console.log('\n7. Testing Thread Statistics...');
    const threadStats = await ThreadsService.getThreadStats();
    if (!threadStats.success) {
      throw new Error(`Failed to get thread stats: ${threadStats.error}`);
    }
    console.log(`✅ Thread stats: ${threadStats.data?.total_threads} total threads`);

    // Test 8: Delete Thread
    console.log('\n8. Testing Thread Deletion...');
    const deleteResult = await ThreadsService.deleteThread(testThreadId!);
    if (!deleteResult.success) {
      throw new Error(`Failed to delete thread: ${deleteResult.error}`);
    }
    console.log(`✅ Thread ${testThreadId} deleted successfully`);

    // Test 9: Verify Deletion
    console.log('\n9. Verifying Thread Deletion...');
    const verifyResult = await ThreadsService.getThreadById(testThreadId!);
    if (verifyResult.success) {
      throw new Error('Thread should have been deleted but still exists');
    }
    console.log('✅ Thread deletion verified');

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);

  } finally {
    // Clean up connection
    try {
      await MongoDBConnections.closeConnection();
      console.log('\n🔌 MongoDB connection closed');
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMongoDB()
    .then(() => {
      console.log('\n✨ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testMongoDB };
