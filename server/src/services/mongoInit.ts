import { MongoDBConnections } from './mongoConnect.js';
import { ThreadMessageModel } from './threadsModel.js';
import { ThreadMessage } from '@enthalpy/shared';

export class MongoDBInitializer {
  static async initializeDatabase(seedCollection: boolean): Promise<void> {
    try {
      console.log('Starting MongoDB initialization...');

      // Initialize connection
      await MongoDBConnections.initializeConnection();
      console.log('MongoDB connection established');

      // Check if threads collection already has data
      const existingThreadsCount = await ThreadMessageModel.countDocuments();
      if (existingThreadsCount > 0 || seedCollection === false) {
        console.log(`Threads collection already has ${existingThreadsCount} documents. Skipping initialization.`);
        return;
      }

      // Create sample threads data
      const sampleThreads: ThreadMessage[] = [
        {
          threadId: 1,
          index: 0,
          user_id: 1,
          project_id: 1,
          role: 'user',
          message_type: 'static',
          message: 'Hello, I need help with my project setup. Can you guide me through the initial configuration?',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 2,
          index: 1,
          user_id: 1,
          project_id: 1,
          role: 'agent',
          message_type: 'thinking',
          message: 'The user is asking for help with project setup. I should provide a comprehensive guide covering the key configuration steps.',
          timestamp: new Date('2024-01-15T10:00:30Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 3,
          index: 2,
          user_id: 1,
          project_id: 1,
          role: 'agent',
          message_type: 'static',
          message: 'I\'d be happy to help you with your project setup! Let\'s start with the basic configuration. First, we\'ll need to set up your environment variables and database connections.',
          timestamp: new Date('2024-01-15T10:01:00Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 4,
          index: 3,
          user_id: 1,
          project_id: 1,
          role: 'agent',
          message_type: 'tool-use',
          message: 'Creating configuration template file...',
          timestamp: new Date('2024-01-15T10:01:15Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 5,
          index: 4,
          user_id: 1,
          project_id: 1,
          role: 'tool_result',
          message_type: 'enth-actions',
          message: 'Configuration template created successfully at /config/template.env',
          timestamp: new Date('2024-01-15T10:01:30Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 6,
          index: 0,
          user_id: 2,
          project_id: 2,
          role: 'user',
          message_type: 'static',
          message: 'I\'m working on a data analysis project and need help with MongoDB queries. Can you help me optimize my aggregation pipeline?',
          timestamp: new Date('2024-01-15T14:30:00Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 7,
          index: 1,
          user_id: 2,
          project_id: 2,
          role: 'agent',
          message_type: 'thinking',
          message: 'The user needs help with MongoDB aggregation pipeline optimization. I should ask about their current pipeline and the performance issues they\'re experiencing.',
          timestamp: new Date('2024-01-15T14:30:15Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 8,
          index: 2,
          user_id: 2,
          project_id: 2,
          role: 'agent',
          message_type: 'static',
          message: 'Absolutely! I can help you optimize your MongoDB aggregation pipeline. Could you share your current pipeline code and tell me what performance issues you\'re experiencing?',
          timestamp: new Date('2024-01-15T14:30:30Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 9,
          index: 0,
          user_id: 3,
          project_id: 3,
          role: 'user',
          message_type: 'static',
          message: 'Starting a new machine learning experiment to predict user engagement patterns.',
          timestamp: new Date('2024-01-16T09:00:00Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 10,
          index: 1,
          user_id: 3,
          project_id: 3,
          role: 'agent',
          message_type: 'thinking',
          message: 'This is an interesting ML project. I should help them establish a proper experimental framework and data pipeline for user engagement prediction.',
          timestamp: new Date('2024-01-16T09:00:20Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 11,
          index: 2,
          user_id: 3,
          project_id: 3,
          role: 'agent',
          message_type: 'static',
          message: 'That sounds like a fascinating project! Predicting user engagement is crucial for product optimization. Let\'s start by defining your features and target variables. What engagement metrics are you looking to predict?',
          timestamp: new Date('2024-01-16T09:00:45Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 12,
          index: 3,
          user_id: 3,
          project_id: 3,
          role: 'agent',
          message_type: 'tool-use',
          message: 'Setting up ML experiment tracking environment...',
          timestamp: new Date('2024-01-16T09:01:00Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 13,
          index: 4,
          user_id: 3,
          project_id: 3,
          role: 'tool_result',
          message_type: 'enth-actions',
          message: 'ML experiment tracking environment initialized with MLflow. Experiment ID: exp_001_user_engagement',
          timestamp: new Date('2024-01-16T09:01:30Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 14,
          index: 0,
          user_id: 1,
          project_id: 4,
          role: 'user',
          message_type: 'static',
          message: 'I need to implement real-time notifications for my web application. What\'s the best approach?',
          timestamp: new Date('2024-01-16T11:15:00Z'),
          agent_name: {
            name: "mc"
          }
        },
        {
          threadId: 15,
          index: 1,
          user_id: 1,
          project_id: 4,
          role: 'agent',
          message_type: 'thinking',
          message: 'For real-time notifications, I should consider WebSockets, Server-Sent Events, or push notifications. The choice depends on their specific requirements and architecture.',
          timestamp: new Date('2024-01-16T11:15:25Z'),
          agent_name: {
            name: "mc"
          }
        }
      ];

      console.log(`Inserting ${sampleThreads.length} sample threads...`);

      // Insert sample data
      await ThreadMessageModel.insertMany(sampleThreads);

      console.log('Sample threads inserted successfully');

      // Create additional indexes if needed
      await ThreadMessageModel.createIndexes();
      console.log('Database indexes created');

      // Verify the insertion
      const insertedCount = await ThreadMessageModel.countDocuments();
      console.log(`MongoDB initialization completed. Total threads in collection: ${insertedCount}`);

    } catch (error) {
      console.error('Error during MongoDB initialization:', error);
      throw error;
    }
  }

  static async resetDatabase(): Promise<void> {
    try {
      console.log('Resetting MongoDB threads collection...');

      // Initialize connection
      await MongoDBConnections.initializeConnection();

      // Drop the collection if it exists
      try {
        await ThreadMessageModel.collection.drop();
        console.log('Threads collection dropped');
      } catch (error: any) {
        if (error.code === 26) {
          console.log('Threads collection does not exist, skipping drop');
        } else {
          throw error;
        }
      }

      // Reinitialize with sample data
      await this.initializeDatabase(true);

      console.log('Database reset completed successfully');

    } catch (error) {
      console.error('Error during database reset:', error);
      throw error;
    }
  }

  static async checkConnection(): Promise<boolean> {
    try {
      await MongoDBConnections.initializeConnection();
      const connection = MongoDBConnections.getConnection();
      return connection.readyState === 1; // 1 means connected
    } catch (error) {
      console.error('MongoDB connection check failed:', error);
      return false;
    }
  }

  static async getDatabaseStats(): Promise<any> {
    try {
      await MongoDBConnections.initializeConnection();

      const connection = MongoDBConnections.getConnection();
      const db = connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      const collections = await db.listCollections().toArray();
      const stats = await db.stats();

      // Get collection stats using countDocuments instead of deprecated stats()
      const threadsCount = await ThreadMessageModel.countDocuments();
      const threadsSize = await ThreadMessageModel.collection.estimatedDocumentCount();

      return {
        database: {
          name: db.databaseName,
          collections: collections.length,
          dataSize: stats.dataSize || 0,
          storageSize: stats.storageSize || 0,
          indexes: stats.indexes || 0
        },
        threads_collection: {
          documents: threadsCount,
          avgObjSize: threadsSize > 0 ? Math.round(stats.dataSize / threadsSize) : 0,
          dataSize: stats.dataSize || 0,
          storageSize: stats.storageSize || 0,
          indexes: 6 // We know we created 6 indexes
        }
      };

    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }
}

// CLI functionality for running initialization standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      MongoDBInitializer.initializeDatabase(false)
        .then(() => {
          console.log('Initialization completed successfully');
          process.exit(0);
        })
        .catch((error) => {
          console.error('Initialization failed:', error);
          process.exit(1);
        });
      break;

    case 'reset':
      MongoDBInitializer.resetDatabase()
        .then(() => {
          console.log('Reset completed successfully');
          process.exit(0);
        })
        .catch((error) => {
          console.error('Reset failed:', error);
          process.exit(1);
        });
      break;

    case 'stats':
      MongoDBInitializer.getDatabaseStats()
        .then((stats) => {
          console.log('Database Statistics:', JSON.stringify(stats, null, 2));
          process.exit(0);
        })
        .catch((error) => {
          console.error('Failed to get stats:', error);
          process.exit(1);
        });
      break;

    case 'check':
      MongoDBInitializer.checkConnection()
        .then((isConnected) => {
          console.log(`MongoDB connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
          process.exit(isConnected ? 0 : 1);
        })
        .catch((error) => {
          console.error('Connection check failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage: node mongoInit.js [init|reset|stats|check]');
      console.log('  init  - Initialize database with sample data');
      console.log('  reset - Drop and recreate database with sample data');
      console.log('  stats - Show database statistics');
      console.log('  check - Check database connection');
      process.exit(1);
  }
}
