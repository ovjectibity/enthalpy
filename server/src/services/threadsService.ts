import { ThreadMessage, Agent, ApiResponse, Thread, CreateThreadData, AppendMessageData } from '@enthalpy/shared';
import { ThreadMessageModel, documentToThreads } from './threadsModel.js';
import { MongoDBConnections } from './mongoConnect.js';

export class ThreadsService {
  static activeThreads: Map<number,Thread> = new Map<number,Thread>();

  // Static function to initialize activeThreads array for given userID & projectID
  // TODO: This needs to be treated as a cache
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
            messages: messages,
            userId: firstMessage.userId,
            projectId: firstMessage.projectId,
            agentName: firstMessage.agentName
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
      const existingMessages = await ThreadMessageModel.find()
        .sort({ index: -1 })
        .limit(1)
        .lean()
        .exec();

      if (existingMessages.length === 0) {
        return {
          success: false,
          error: 'No threads found'
        };
      }

      const lastMessage = existingMessages[0];
      const nextIndex = lastMessage.index + 1;

      const threadMessageData: ThreadMessage = {
        threadId: threadId,
        index: nextIndex,
        userId: lastMessage.user_id,
        projectId: lastMessage.project_id,
        role: messageData.role,
        messageType: messageData.messageType,
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
        agentName: lastMessage.agent_name
      };

      //Add to the list of actively maintained threads
      if(this.activeThreads.get(threadId)) {
        this.activeThreads.get(threadId)?.messages.push(threadMessageData);
      } else {
        throw new Error("Could not find any thread to append the message to.");
      }

      const newMessage = new ThreadMessageModel(ThreadMessageModel.toDocuments(threadMessageData));
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
      const lastThread = await ThreadMessageModel.findOne().sort({ thread_idx: -1 }).exec();
      const newThreadId = lastThread ? lastThread.thread_id + 1 : 1;

      // Create the new thread with an initial empty structure
      const thread: Thread = {
        threadId: newThreadId,
        messages: [],
        userId: threadData.userId,
        projectId: threadData.projectId,
        agentName: threadData.agentName
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
    agentName: Agent
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
        agent_name: agentName
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
            messages: messages,
            userId: firstMessage.userId,
            projectId: firstMessage.projectId,
            agentName: firstMessage.agentName
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
