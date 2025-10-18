# Enthalpy API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication
Currently, the API uses `userId` as a query parameter or request body field for user identification. In production, this should be replaced with proper JWT authentication.

## Hypotheses API

### Get All Hypotheses
Get all hypotheses for a specific user with filtering, sorting, and pagination.

**Endpoint:** `GET /api/hypotheses`

**Query Parameters:**
- `userId` (required) - User identifier
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `sortBy` (optional) - Sort field: `title`, `createdAt`, `updatedAt` (default: `createdAt`)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)
- `search` (optional) - Search in title, action, and rationale
- `objectiveId` (optional) - Filter by specific objective ID
- `startDate` (optional) - Filter by creation date (ISO string)
- `endDate` (optional) - Filter by creation date (ISO string)

**Example Request:**
```bash
GET /api/hypotheses?userId=user_123&page=1&limit=5&search=onboarding&sortBy=title&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Onboarding Flow Optimization",
      "action": "Implement user onboarding flow",
      "rationale": "New users are dropping off during signup process",
      "expectedOutcome": "Increase user conversion rate by 25%",
      "userId": "user_123",
      "objectives": [...],
      "experiments": [...],
      "metrics": [...],
      "feedback": [...],
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 2,
    "totalPages": 1
  }
}
```

### Get Hypothesis by ID
Get a specific hypothesis by its ID.

**Endpoint:** `GET /api/hypotheses/:id`

**Query Parameters:**
- `userId` (required) - User identifier

**Example Request:**
```bash
GET /api/hypotheses/1?userId=user_123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Onboarding Flow Optimization",
    "action": "Implement user onboarding flow",
    "rationale": "New users are dropping off during signup process",
    "expectedOutcome": "Increase user conversion rate by 25%",
    "userId": "user_123",
    "objectives": [
      {
        "id": "obj_1",
        "title": "Improve User Acquisition",
        "userId": "user_123",
        "createdAt": "2024-01-15T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "experiments": [
      {
        "id": "exp_1",
        "name": "A/B Test Welcome Screen",
        "key": "onboarding_welcome_ab",
        "status": "PENDING_DESIGN",
        "hypothesisId": "1",
        "createdAt": "2024-01-15T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "metrics": [
      {
        "id": "met_1",
        "name": "User Conversion Rate",
        "formula": "(Converted Users / Total Signups) * 100",
        "category": "Activation",
        "hypothesisId": "1",
        "createdAt": "2024-01-15T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    ],
    "feedback": [],
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

### Create New Hypothesis
Create a new hypothesis for a user.

**Endpoint:** `POST /api/hypotheses`

**Request Body:**
```json
{
  "userId": "user_123",
  "title": "New Hypothesis Title",
  "action": "Specific action to take",
  "rationale": "Reasoning behind the hypothesis",
  "expectedOutcome": "Expected result",
  "objectiveIds": ["obj_1", "obj_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "hyp_1234567890",
    "title": "New Hypothesis Title",
    "action": "Specific action to take",
    "rationale": "Reasoning behind the hypothesis",
    "expectedOutcome": "Expected result",
    "userId": "user_123",
    "objectives": [],
    "experiments": [],
    "metrics": [],
    "feedback": [],
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  },
  "message": "Hypothesis created successfully"
}
```

### Update Hypothesis
Update an existing hypothesis.

**Endpoint:** `PUT /api/hypotheses/:id`

**Request Body:**
```json
{
  "userId": "user_123",
  "title": "Updated Title",
  "action": "Updated action",
  "rationale": "Updated rationale",
  "expectedOutcome": "Updated expected outcome"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Updated Title",
    "action": "Updated action",
    "rationale": "Updated rationale",
    "expectedOutcome": "Updated expected outcome",
    "userId": "user_123",
    "objectives": [...],
    "experiments": [...],
    "metrics": [...],
    "feedback": [...],
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  },
  "message": "Hypothesis updated successfully"
}
```

### Delete Hypothesis
Delete a hypothesis.

**Endpoint:** `DELETE /api/hypotheses/:id`

**Query Parameters:**
- `userId` (required) - User identifier

**Example Request:**
```bash
DELETE /api/hypotheses/1?userId=user_123
```

**Response:**
```json
{
  "success": true,
  "message": "Hypothesis deleted successfully"
}
```

### Get User Statistics
Get statistics about a user's hypotheses.

**Endpoint:** `GET /api/hypotheses/user/:userId/stats`

**Example Request:**
```bash
GET /api/hypotheses/user/user_123/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "totalExperiments": 3,
    "totalMetrics": 3,
    "feedbackStats": {
      "positive": 5,
      "negative": 1
    },
    "recentlyCreated": [
      {
        "id": "2",
        "title": "Payment Process Simplification",
        "createdAt": "2024-01-16T00:00:00.000Z"
      },
      {
        "id": "1",
        "title": "Onboarding Flow Optimization",
        "createdAt": "2024-01-15T00:00:00.000Z"
      }
    ]
  }
}
```

### Submit Feedback
Submit feedback for a hypothesis.

**Endpoint:** `POST /api/hypotheses/:id/feedback`

**Request Body:**
```json
{
  "userId": "user_123",
  "rating": "positive",
  "comment": "This hypothesis is very insightful and addresses a key user pain point."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "id": "feedback_1234567890",
    "rating": "positive",
    "comment": "This hypothesis is very insightful and addresses a key user pain point.",
    "assetType": "hypothesis",
    "assetId": "1",
    "userId": "user_123",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### Hypothesis
```typescript
{
  id: string;
  title: string;
  action: string;
  rationale: string;
  expectedOutcome: string;
  userId: string;
  objectives: Objective[];
  experiments: Experiment[];
  metrics: Metric[];
  feedback: Feedback[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Objective
```typescript
{
  id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Experiment
```typescript
{
  id: string;
  name: string;
  key: string;
  status: 'PENDING_DESIGN' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  description?: string;
  hypothesisId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Metric
```typescript
{
  id: string;
  name: string;
  formula: string;
  category: 'Acquisition' | 'Activation' | 'Retention' | 'Referral' | 'Revenue';
  description?: string;
  hypothesisId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Feedback
```typescript
{
  id: string;
  rating: 'positive' | 'negative';
  comment?: string;
  assetType: 'hypothesis' | 'experiment' | 'objective' | 'metric';
  assetId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Next Steps

1. **Database Integration**: Replace mock data with actual database operations (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Implement JWT-based authentication
3. **Validation**: Add request validation using libraries like Joi or Zod
4. **Rate Limiting**: Add rate limiting for API endpoints
5. **Caching**: Implement caching for frequently accessed data
6. **Logging**: Add structured logging for better monitoring
7. **Testing**: Add unit and integration tests
8. **Documentation**: Generate OpenAPI/Swagger documentation