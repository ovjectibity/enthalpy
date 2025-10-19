import { ThreadMessage, Thread, ApiResponse, Agent } from '@enthalpy/shared';
import { ThreadMessageModel, documentToThreads } from './threadsModel.js';
import { MongoDBConnections } from './mongoConnect.js';

export interface CreateThreadData {
  project_id: number;
  user_id: number;
  agent_name: Agent['name'];
}

export interface AppendMessageData {
  role: ThreadMessage['role'];
  message_type: ThreadMessage['message_type'];
  message: string;
  timestamp?: Date;
}

export class ThreadsService {
  static activeThreads: Map<number,Thread> = new Map<number,Thread>();

  // Static function to initialize activeThreads array for given userID & projectID
  static async initializeActiveThreads(
    projectId: number,
    userId: number
  ): Promise<void> {
    try {
      const result = await this.getThreadsByProjectAndUser(projectId, userId);
      if (result.success && result.data) {
        for(const thread of result.data) {
          this.activeThreads.set(thread.threadId, thread);
        }
      }
    } catch (error) {
      console.error('Error initializing active threads:', error);
    }
  }

  // 1. Get all threads for a given project ID & user ID
  static async getThreadsByProjectAndUser(
    projectId: number,
    userId: number
  ): Promise<ApiResponse<Thread[]>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Find all ThreadMessages for this project and user
      const threadMessages = await ThreadMessageModel.find({
        project_id: projectId,
        user_id: userId
      })
      .sort({ thread_id: 1, index: 1 })
      .lean()
      .exec();

      // Group messages by thread_id
      const threadGroups = new Map<number, ThreadMessage[]>();

      for (const msg of threadMessages) {
        const threadMessage = documentToThreads(msg);
        if (!threadGroups.has(threadMessage.threadId)) {
          threadGroups.set(threadMessage.threadId, []);
        }
        threadGroups.get(threadMessage.threadId)!.push(threadMessage);
      }

      // Convert to Thread objects
      const threads: Thread[] = [];
      for (const [threadId, messages] of threadGroups) {
        if (messages.length > 0) {
          const firstMessage = messages[0];
          threads.push({
            threadId: threadId,
            threads: messages,
            user_id: firstMessage.user_id,
            project_id: firstMessage.project_id,
            agent_name: firstMessage.agent_name
          });
        }
      }

      return {
        success: true,
        data: threads
      };

    } catch (error) {
      console.error('Error getting threads by project and user:', error);
      return {
        success: false,
        error: 'Failed to get threads'
      };
    }
  }

  // 2. Append a thread message to an existing thread
  static async appendMessageToThread(
    threadId: number,
    messageData: AppendMessageData
  ): Promise<ApiResponse<ThreadMessage>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Find existing thread to get context
      const existingMessages = await ThreadMessageModel.find({ thread_id: threadId })
        .sort({ index: -1 })
        .limit(1)
        .lean()
        .exec();

      if (existingMessages.length === 0) {
        return {
          success: false,
          error: 'Thread not found'
        };
      }

      const lastMessage = existingMessages[0];
      const nextIndex = lastMessage.index + 1;

      const threadMessageData: ThreadMessage = {
        threadId: threadId,
        index: nextIndex,
        user_id: lastMessage.user_id,
        project_id: lastMessage.project_id,
        role: messageData.role,
        message_type: messageData.message_type,
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
        agent_name: {
          name: lastMessage.agent_name
        }
      };

      //Add to the list of actively maintained threads
      if(this.activeThreads.get(threadId)) {
        this.activeThreads.get(threadId)?.threads.push(threadMessageData);
      } else {
        throw new Error("Could not find any thread to append the message to.");
      }

      const newMessage = new ThreadMessageModel(threadMessageData);
      await newMessage.save();

      return {
        success: true,
        data: threadMessageData,
        message: 'Message appended to thread successfully'
      };

    } catch (error) {
      console.error('Error appending message to thread:', error);
      return {
        success: false,
        error: 'Failed to append message to thread'
      };
    }
  }

  // 3. Create a new thread for given project, user ID & agent name
  static async createNewThread(threadData: CreateThreadData): Promise<ApiResponse<Thread>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Generate unique IDs
      const lastThread = await ThreadMessageModel.findOne().sort({ thread_id: -1 }).exec();
      const newThreadId = lastThread ? lastThread.thread_id + 1 : 1;

      // Create the new thread with an initial empty structure
      const thread: Thread = {
        threadId: newThreadId,
        threads: [],
        user_id: threadData.user_id,
        project_id: threadData.project_id,
        agent_name: { name: threadData.agent_name } as Agent
      };

      //Add to the list of actively maintained threads
      this.activeThreads.set(newThreadId, thread);

      return {
        success: true,
        data: thread,
        message: 'Thread created successfully'
      };

    } catch (error) {
      console.error('Error creating new thread:', error);
      return {
        success: false,
        error: 'Failed to create new thread'
      };
    }
  }

  // 4. Get all threads for project ID, user ID & agent name
  static async getThreadsByProjectUserAndAgent(
    projectId: number,
    userId: number,
    agentName: Agent['name']
  ): Promise<ApiResponse<Thread[]>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Find all ThreadMessages for this project, user, and agent
      const threadMessages = await ThreadMessageModel.find({
        project_id: projectId,
        user_id: userId,
        'agent_name.name': agentName
      })
      .sort({ thread_id: 1, index: 1 })
      .lean()
      .exec();

      // Group messages by thread_id
      const threadGroups = new Map<number, ThreadMessage[]>();

      for (const msg of threadMessages) {
        const threadMessage = documentToThreads(msg);
        if (!threadGroups.has(threadMessage.threadId)) {
          threadGroups.set(threadMessage.threadId, []);
        }
        threadGroups.get(threadMessage.threadId)!.push(threadMessage);
      }

      // Convert to Thread objects
      const threads: Thread[] = [];
      for (const [threadId, messages] of threadGroups) {
        if (messages.length > 0) {
          const firstMessage = messages[0];
          threads.push({
            threadId: threadId,
            threads: messages,
            user_id: firstMessage.user_id,
            project_id: firstMessage.project_id,
            agent_name: firstMessage.agent_name
          });
        }
      }

      return {
        success: true,
        data: threads
      };

    } catch (error) {
      console.error('Error getting threads by project, user and agent:', error);
      return {
        success: false,
        error: 'Failed to get threads'
      };
    }
  }
}
