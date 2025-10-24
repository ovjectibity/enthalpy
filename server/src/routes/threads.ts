import express from 'express';
import { ThreadsService } from '../services/threadsService.js';
import { ThreadMessage, Agent } from '@enthalpy/shared';

const router = express.Router();

// Validation utilities
const isValidRole = (role: string): role is ThreadMessage['role'] =>
  ['agent', 'user', 'tool_result'].includes(role);

const isValidMessageType = (messageType: string): messageType is ThreadMessage['messageType'] =>
  ['static', 'thinking', 'tool-use', 'enth-actions'].includes(messageType);

const isValidAgentName = (agentName: string): boolean =>
  ['mc', 'flow-graph', 'exp-design', 'hypotheses'].includes(agentName);

// 1. GET /api/threads/project/:projectId/user/:userId - Get all threads for a given project ID & user ID
router.get('/project/:projectId/user/:userId', async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);

    if (isNaN(projectId) || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID or user ID'
      });
    }

    const result = await ThreadsService.getThreadsByProjectAndUser(projectId, userId);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in GET /threads/project/:projectId/user/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 2. POST /api/threads/:threadId/messages - Append a thread message to an existing thread
router.post('/:threadId/messages', async (req, res) => {
  try {
    const threadId = Number(req.params.threadId);

    if (isNaN(threadId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid thread ID'
      });
    }

    // Validate required fields
    const requiredFields = ['role', 'message_type', 'message'];
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

    const messageData = {
      role: req.body.role,
      messageType: req.body.message_type,
      message: req.body.message,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : undefined,
      threadId: threadId,
      projectId: 1, //TODO: Handle projects here
      agentName: "mc" as Agent, //TODO: Handle agent names here, via the DB
    };

    const result = await ThreadsService.appendMessageToThread(threadId, messageData);
    res.status(result.success ? 201 : (result.error?.includes('not found') ? 404 : 500)).json(result);
  } catch (error) {
    console.error('Error in POST /threads/:threadId/messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 3. POST /api/threads - Create a new thread for given project, user ID & agent name
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['project_id', 'user_id', 'agent_name'];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate numeric fields
    const projectId = Number(req.body.project_id);
    const userId = Number(req.body.user_id);

    if (isNaN(projectId) || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid numeric values for project_id or user_id'
      });
    }

    // Validate agent name
    if (!isValidAgentName(req.body.agent_name)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agent_name. Must be one of: mc, flow-graph, exp-design, hypotheses'
      });
    }

    const threadData = {
      projectId: projectId,
      userId: userId,
      agentName: req.body.agent_name,
      role: req.body.role || 'agent', // default to agent if not specified
      agent: req.body.agent || 'static' // default message type if not specified
    };

    const result = await ThreadsService.createNewThread(threadData);
    res.status(result.success ? 201 : 500).json(result);
  } catch (error) {
    console.error('Error in POST /threads:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 4. GET /api/threads/project/:projectId/user/:userId/agent/:agentName - Get all threads for project ID, user ID & agent name
router.get('/project/:projectId/user/:userId/agent/:agentName', async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const userId = Number(req.params.userId);
    const agentName = req.params.agentName;

    if (isNaN(projectId) || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID or user ID'
      });
    }

    if (!isValidAgentName(agentName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agent_name. Must be one of: mc, flow-graph, exp-design, hypotheses'
      });
    }

    const result = await ThreadsService.getThreadsByProjectUserAndAgent(projectId, userId, agentName as Agent);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in GET /threads/project/:projectId/user/:userId/agent/:agentName:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as threadsRouter };
