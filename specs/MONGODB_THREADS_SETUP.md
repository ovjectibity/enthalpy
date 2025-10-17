# MongoDB Threads Service - Complete Setup Guide

This document provides a comprehensive guide for setting up and using the MongoDB Threads service in the Enthalpy project.

## 📋 Overview

The MongoDB Threads service provides CRUD operations for managing conversation threads between users and AI agents. It includes:

- MongoDB connection management using Mongoose
- Complete CRUD service for Threads collection
- REST API endpoints
- Database initialization with sample data
- Comprehensive error handling and validation

## 🗂️ Files Created

### Core Service Files
- `server/src/services/mongoConnect.ts` - MongoDB connection management
- `server/src/services/threadsModel.ts` - Mongoose schema and model
- `server/src/services/threadsService.ts` - CRUD operations service
- `server/src/services/mongoInit.ts` - Database initialization

### API and Utilities
- `server/src/routes/threads.ts` - REST API endpoints
- `mongo-init.ts` - Standalone initialization script
- `server/test-mongo.ts` - Test script for validation
- `server/MONGODB_SETUP.md` - Detailed documentation

### Configuration
- `.env.example` - Environment variables template
- Updated `compose.yml` - Added MongoDB environment variables
- Updated `server/package.json` - Added initialization scripts
- Updated `server/src/index.ts` - Integrated MongoDB service

## 🚀 Quick Start

### 1. Set up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
MONGO_HOST=localhost
MONGO_PORT=27017

# Optional: Complete MongoDB URI
MONGODB_URI=mongodb://admin:password@localhost:27017/assets?authSource=admin
```

### 2. Start Services

```bash
# Start MongoDB and PostgreSQL
docker-compose up -d mongodb

# Or start all services
docker-compose up -d
```

### 3. Initialize Database

```bash
cd server
npm run mongo-init init
```

### 4. Test the Setup

```bash
npm run test-mongo
```

## 📊 Database Schema

The Threads collection follows this schema:

```typescript
interface Threads {
  id: number;                    // Unique identifier
  index: number;                 // Thread order index
  user_id: number;               // User ID
  project_id: number;            // Project ID
  role: "agent" | "user" | "tool_result";
  message_type: "static" | "thinking" | "tool-use" | "enth-actions";
  message: string;               // Message content
  timestamp: Date;               // Creation timestamp
  agent_name: string;            // Agent/user name
}
```

### Indexes Created
- `user_id` (single field)
- `project_id` (single field)  
- `user_id + project_id` (compound)
- `timestamp` (for sorting)
- `id` (unique identifier)

## 🔧 Available Commands

### Database Management
```bash
# Initialize with sample data
npm run mongo-init init

# Reset database (drop and recreate)
npm run mongo-init reset

# Check connection
npm run mongo-init check

# View statistics
npm run mongo-init stats

# Show help
npm run mongo-init help
```

### Testing
```bash
# Run comprehensive tests
npm run test-mongo
```

## 🌐 API Endpoints

### Base URL: `/api/threads`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all threads (with filtering/pagination) |
| GET | `/stats` | Get thread statistics |
| GET | `/:id` | Get thread by ID |
| GET | `/user/:userId/project/:projectId` | Get threads by user and project |
| POST | `/` | Create new thread |
| PUT | `/:id` | Update thread |
| DELETE | `/:id` | Delete thread |
| DELETE | `/project/:projectId` | Delete all threads for project |
| DELETE | `/user/:userId` | Delete all threads for user |

### Query Parameters (GET endpoints)

- `user_id` - Filter by user ID
- `project_id` - Filter by project ID
- `role` - Filter by role (agent|user|tool_result)
- `message_type` - Filter by message type
- `agent_name` - Filter by agent name
- `search` - Search in message content
- `startDate` / `endDate` - Date range filtering
- `page` / `limit` - Pagination
- `sortBy` / `sortOrder` - Sorting

## 📝 Usage Examples

### Service Usage

```typescript
import { ThreadsService } from './services/threadsService.js';

// Create a thread
const result = await ThreadsService.createThread({
  index: 0,
  user_id: 1,
  project_id: 1,
  role: 'user',
  message_type: 'static',
  message: 'Hello, how can I help?',
  agent_name: 'User'
});

// Get threads with pagination
const threads = await ThreadsService.getAllThreads({
  user_id: 1,
  project_id: 1,
  page: 1,
  limit: 10,
  sortBy: 'timestamp',
  sortOrder: 'desc'
});

// Update a thread
const updated = await ThreadsService.updateThread(1, {
  message: 'Updated message',
  message_type: 'thinking'
});
```

### API Usage

```bash
# Get threads for user 1, project 1
curl "http://localhost:3001/api/threads?user_id=1&project_id=1&page=1&limit=5"

# Create a new thread
curl -X POST http://localhost:3001/api/threads \
  -H "Content-Type: application/json" \
  -d '{
    "index": 0,
    "user_id": 1,
    "project_id": 1,
    "role": "user",
    "message_type": "static",
    "message": "Test message",
    "agent_name": "TestUser"
  }'

# Get thread by ID
curl "http://localhost:3001/api/threads/1"

# Get statistics
curl "http://localhost:3001/api/threads/stats"
```

## 🔍 Sample Data

The initialization script creates 15 sample threads demonstrating:

- User-agent conversations
- Different message types (static, thinking, tool-use, enth-actions)
- Multiple users and projects
- Various roles (user, agent, tool_result)
- Realistic conversation flows

## 🛠️ Integration with Server

The MongoDB service is integrated into the main server:

1. **Automatic Initialization**: MongoDB connection is established on server startup
2. **Graceful Shutdown**: Connections are properly closed on server termination
3. **Error Handling**: Server continues running even if MongoDB is unavailable
4. **Route Integration**: Threads API is mounted at `/api/threads`

## 🔧 Development Workflow

### Adding New Features

1. **Update Schema**: Modify the `Threads` interface in `shared/src/types/types.ts`
2. **Update Model**: Modify `threadsModel.ts` to include new fields
3. **Update Service**: Add new methods to `threadsService.ts`
4. **Add Routes**: Create new endpoints in `routes/threads.ts`
5. **Add Validation**: Update request validation in routes
6. **Update Tests**: Add tests for new functionality

### Testing Changes

```bash
# Test database connection
npm run mongo-init check

# Run full test suite
npm run test-mongo

# Check specific functionality
npm run mongo-init stats
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify MongoDB is running: `docker-compose ps`
   - Check environment variables
   - Test connection: `npm run mongo-init check`

2. **Permission Denied**
   - Verify MongoDB user credentials
   - Check database permissions
   - Ensure `authSource=admin` in connection string

3. **Port Conflicts**
   - MongoDB default port: 27017
   - Update `MONGO_PORT` if needed
   - Check `compose.yml` port mappings

4. **Initialization Fails**
   - Check MongoDB logs: `docker-compose logs mongodb`
   - Verify environment variables
   - Try resetting: `npm run mongo-init reset`

### Debug Commands

```bash
# Check Docker containers
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Check database statistics
npm run mongo-init stats

# Test full functionality
npm run test-mongo
```

## 🔒 Production Considerations

1. **Security**
   - Use strong passwords
   - Enable MongoDB authentication
   - Use SSL/TLS for connections
   - Restrict network access

2. **Performance**
   - Monitor query performance
   - Add indexes for common queries
   - Consider connection pooling settings
   - Monitor memory usage

3. **Backup & Recovery**
   - Implement regular backups
   - Test restore procedures
   - Consider replica sets for high availability

4. **Monitoring**
   - Monitor connection health
   - Track query performance
   - Set up alerts for failures

## ✅ Validation Checklist

- [ ] MongoDB container starts successfully
- [ ] Database initialization completes
- [ ] API endpoints respond correctly
- [ ] CRUD operations work as expected
- [ ] Test script passes all tests
- [ ] Statistics endpoint returns data
- [ ] Error handling works properly
- [ ] Documentation is accessible

## 🎯 Next Steps

1. **Integration Testing**: Test with frontend client
2. **Performance Testing**: Load test the API endpoints
3. **Security Review**: Audit authentication and authorization
4. **Monitoring Setup**: Implement logging and metrics
5. **Backup Strategy**: Set up automated backups

---

This setup provides a robust, production-ready MongoDB service for managing conversation threads in your Enthalpy project. The service includes comprehensive error handling, validation, and documentation to ensure reliable operation.