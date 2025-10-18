import express from 'express';
import { ThreadsService, CreateThreadRequest, UpdateThreadRequest, GetThreadsQuery } from '../services/threadsService.js';
import { ThreadMessage } from '@enthalpy/shared';

const router = express.Router();

// Validation utilities
const isValidRole = (role: string): role is ThreadMessage['role'] =>
  ['agent', 'user', 'tool_result'].includes(role);

const isValidMessageType = (messageType: string): messageType is ThreadMessage['message_type'] =>
  ['static', 'thinking', 'tool-use', 'enth-actions'].includes(messageType);

// GET /api/threads/stats - Get thread statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await ThreadsService.getThreadStats();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in GET /threads/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/threads/user/:userId/project/:projectId - Get threads by user and project
router.get('/user/:userId/project/:projectId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const projectId = Number(req.params.projectId);

    if (isNaN(userId) || isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID or project ID'
      });
    }

    const paginationQuery = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as "asc" | "desc" | undefined
    };

    const result = await ThreadsService.getThreadsByUserAndProject(userId, projectId, paginationQuery);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in GET /threads/user/:userId/project/:projectId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/threads/:id - Get thread by ID
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    const result = await ThreadsService.getThreadById(id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error in GET /threads/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/threads - Create new thread
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['index', 'user_id', 'project_id', 'role', 'message_type', 'message', 'agent_name'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate enum values
    if (!isValidRole(req.body.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: agent, user, tool_result'
      });
    }

    if (!isValidMessageType(req.body.message_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message_type. Must be one of: static, thinking, tool-use, enth-actions'
      });
    }

    const createData: CreateThreadRequest = {
      index: Number(req.body.index),
      user_id: Number(req.body.user_id),
      project_id: Number(req.body.project_id),
      role: req.body.role,
      message_type: req.body.message_type,
      message: req.body.message,
      agent_name: req.body.agent_name,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined
    };

    // Validate numeric fields
    if (isNaN(createData.index) || isNaN(createData.user_id) || isNaN(createData.project_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid numeric values for index, user_id, or project_id'
      });
    }

    const result = await ThreadsService.createThread(createData);
    res.status(result.success ? 201 : 500).json(result);
  } catch (error) {
    console.error('Error in POST /threads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/threads/:id - Update thread
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    // Validate enum values if provided
    if (req.body.role && !isValidRole(req.body.role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: agent, user, tool_result'
      });
    }

    if (req.body.message_type && !isValidMessageType(req.body.message_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message_type. Must be one of: static, thinking, tool-use, enth-actions'
      });
    }

    const updateData: UpdateThreadRequest = {};

    // Only include fields that are provided
    if (req.body.index !== undefined) updateData.index = Number(req.body.index);
    if (req.body.user_id !== undefined) updateData.user_id = Number(req.body.user_id);
    if (req.body.project_id !== undefined) updateData.project_id = Number(req.body.project_id);
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.message_type !== undefined) updateData.message_type = req.body.message_type;
    if (req.body.message !== undefined) updateData.message = req.body.message;
    if (req.body.agent_name !== undefined) updateData.agent_name = req.body.agent_name;
    if (req.body.timestamp !== undefined) updateData.timestamp = new Date(req.body.timestamp);

    // Validate numeric fields if provided
    if ((updateData.index !== undefined && isNaN(updateData.index)) ||
        (updateData.user_id !== undefined && isNaN(updateData.user_id)) ||
        (updateData.project_id !== undefined && isNaN(updateData.project_id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid numeric values for index, user_id, or project_id'
      });
    }

    const result = await ThreadsService.updateThread(id, updateData);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error in PUT /threads/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/threads/:id - Delete thread
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    const result = await ThreadsService.deleteThread(id);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error in DELETE /threads/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/threads/project/:projectId - Delete all threads for a project
router.delete('/project/:projectId', async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }

    const result = await ThreadsService.deleteThreadsByProject(projectId);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in DELETE /threads/project/:projectId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/threads/user/:userId - Delete all threads for a user
router.delete('/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const result = await ThreadsService.deleteThreadsByUser(userId);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in DELETE /threads/user/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as threadsRouter };
