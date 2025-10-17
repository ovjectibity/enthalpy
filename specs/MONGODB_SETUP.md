# MongoDB Setup for Threads Service

This document describes the MongoDB setup for managing Threads data in the Enthalpy project.

## Overview

The MongoDB service provides CRUD operations for the Threads collection, which stores conversation threads between users and AI agents. The service is built using Mongoose ODM and provides a REST API for thread management.

## Files Structure

```
server/src/services/
├── mongoConnect.ts      # MongoDB connection management
├── threadsModel.ts      # Mongoose schema and model for Threads
├── threadsService.ts    # CRUD operations service
└── mongoInit.ts         # Database initialization script

server/src/routes/
└── threads.ts           # REST API endpoints

mongo-init.ts            # Standalone initialization script
```

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_HOST=localhost
MONGO_PORT=27017

# Optional: Complete MongoDB URI (overrides individual settings)
MONGODB_URI=mongodb://admin:password@localhost:27017/assets?authSource=admin
```

## Database Schema

The Threads collection uses the following schema:

```typescript
interface Threads {
  id: number;                    // Unique thread identifier
  index: number;                 // Thread order index
  user_id: number;               // User identifier
  project_id: number;            // Project identifier
  role: "agent" | "user" | "tool_result";
  message_type: "static" | "thinking" | "tool-use" | "enth-actions";
  message: string;               // Thread message content
  timestamp: Date;               // When the thread was created
  agent_name: string;            // Name of the agent/user
}
```

## Quick Start

1. **Start MongoDB** (using Docker Compose):
   ```bash
   docker-compose up -d mongodb
   ```

2. **Initialize the database**:
   ```bash
   cd server
   npm run mongo-init init
   ```

3. **Verify the setup**:
   ```bash
   npm run mongo-init check
   npm run mongo-init stats
   ```

## Initialization Commands

The MongoDB initialization script supports several commands:

### Initialize Database
```bash
npm run mongo-init init
```
Creates the threads collection and inserts sample data if the collection is empty.

### Reset Database
```bash
npm run mongo-init reset
```
Drops the existing threads collection and recreates it with sample data.

### Check Connection
```bash
npm run mongo-init check
```
Tests the MongoDB connection and reports the status.

### Database Statistics
```bash
npm run mongo-init stats
```
Shows detailed statistics about the database and threads collection.

### Help
```bash
npm run mongo-init help
```
Displays usage information and available commands.

## API Endpoints

The Threads service provides the following REST API endpoints:

### Get All Threads
```http
GET /api/threads?user_id=1&project_id=1&page=1&limit=10
```

Query parameters:
- `user_id` (optional): Filter by user ID
- `project_id` (optional): Filter by project ID
- `role` (optional): Filter by role (agent|user|tool_result)
- `message_type` (optional): Filter by message type
- `agent_name` (optional): Filter by agent name
- `search` (optional): Search in message content and agent name
- `startDate` (optional): Filter threads after this date
- `endDate` (optional): Filter threads before this date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: timestamp)
- `sortOrder` (optional): Sort order (asc|desc, default: desc)

### Get Thread by ID
```http
GET /api/threads/:id
```

### Get Threads by User and Project
```http
GET /api/threads/user/:userId/project/:projectId
```

### Create Thread
```http
POST /api/threads
Content-Type: application/json

{
  "index": 0,
  "user_id": 1,
  "project_id": 1,
  "role": "user",
  "message_type": "static",
  "message": "Hello, how can I help you today?",
  "agent_name": "Assistant",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Update Thread
```http
PUT /api/threads/:id
Content-Type: application/json

{
  "message": "Updated message content",
  "message_type": "thinking"
}
```

### Delete Thread
```http
DELETE /api/threads/:id
```

### Delete Threads by Project
```http
DELETE /api/threads/project/:projectId
```

### Delete Threads by User
```http
DELETE /api/threads/user/:userId
```

### Get Statistics
```http
GET /api/threads/stats
```

## Service Usage

### Import and Use the Service

```typescript
import { ThreadsService } from './services/threadsService.js';

// Get threads for a specific user and project
const threads = await ThreadsService.getThreadsByUserAndProject(1, 1, {
  page: 1,
  limit: 20,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});

// Create a new thread
const newThread = await ThreadsService.createThread({
  index: 0,
  user_id: 1,
  project_id: 1,
  role: 'user',
  message_type: 'static',
  message: 'Hello, world!',
  agent_name: 'User'
});
```

### Connection Management

The MongoDB connection is managed automatically by the service. However, you can manually manage connections:

```typescript
import { MongoDBConnections } from './services/mongoConnect.js';

// Initialize connection
await MongoDBConnections.initializeConnection();

// Close connection
await MongoDBConnections.closeConnection();
```

## Sample Data

The initialization script creates sample threads with various roles and message types:
- User messages asking for help
- Agent thinking processes
- Tool usage examples
- System responses

This sample data helps you understand the thread structure and test the API endpoints.

## Indexes

The service automatically creates the following indexes for optimal query performance:
- `user_id`
- `project_id`
- `user_id + project_id` (compound index)
- `timestamp` (for sorting)
- `id` (unique index)

## Error Handling

All service methods return standardized API responses:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}
```

## Troubleshooting

### Connection Issues
1. Verify MongoDB is running: `docker-compose ps`
2. Check environment variables in `.env` file
3. Test connection: `npm run mongo-init check`

### Permission Issues
Ensure the MongoDB user has proper permissions on the `assets` database.

### Port Conflicts
If port 27017 is in use, update the `MONGO_PORT` environment variable and docker-compose.yml.

## Development

To extend the service:

1. **Add new fields**: Update the `Threads` interface in `shared/src/types/types.ts`
2. **Update schema**: Modify `threadsModel.ts` to include new fields
3. **Add validation**: Update the API routes to validate new fields
4. **Add indexes**: Consider adding indexes for new queryable fields

## Production Considerations

1. **Connection Pooling**: Mongoose handles connection pooling automatically
2. **Error Logging**: Consider integrating with a proper logging service
3. **Monitoring**: Monitor MongoDB performance and query patterns
4. **Backup**: Implement regular database backups
5. **Security**: Use proper authentication and network security
6. **Scaling**: Consider MongoDB replica sets for high availability