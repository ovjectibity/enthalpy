import { Threads, ApiResponse, PaginatedResponse, PaginationParams } from '@enthalpy/shared';
import { ThreadsModel, IThreadsDocument } from './threadsModel.js';
import { MongoDBConnections } from './mongoConnect.js';

// Utility function to convert MongoDB document to Threads interface
function documentToThreads(doc: any): Threads {
  return {
    id: doc.id,
    index: doc.index,
    user_id: doc.user_id,
    project_id: doc.project_id,
    role: doc.role,
    message_type: doc.message_type,
    message: doc.message,
    timestamp: doc.timestamp,
    agent_name: doc.agent_name
  };
}

export interface CreateThreadRequest {
  index: number;
  user_id: number;
  project_id: number;
  role: "agent" | "user" | "tool_result";
  message_type: "static" | "thinking" | "tool-use" | "enth-actions";
  message: string;
  agent_name: string;
  timestamp?: Date;
}

export interface UpdateThreadRequest {
  index?: number;
  user_id?: number;
  project_id?: number;
  role?: "agent" | "user" | "tool_result";
  message_type?: "static" | "thinking" | "tool-use" | "enth-actions";
  message?: string;
  agent_name?: string;
  timestamp?: Date;
}

export interface GetThreadsQuery extends PaginationParams {
  user_id?: number;
  project_id?: number;
  role?: "agent" | "user" | "tool_result";
  message_type?: "static" | "thinking" | "tool-use" | "enth-actions";
  agent_name?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class ThreadsService {

  static async getAllThreads(query: GetThreadsQuery): Promise<PaginatedResponse<Threads>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Build filter object
      const filter: any = {};

      if (query.user_id) filter.user_id = query.user_id;
      if (query.project_id) filter.project_id = query.project_id;
      if (query.role) filter.role = query.role;
      if (query.message_type) filter.message_type = query.message_type;
      if (query.agent_name) filter.agent_name = query.agent_name;

      // Date filters
      if (query.startDate || query.endDate) {
        filter.timestamp = {};
        if (query.startDate) {
          filter.timestamp.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
          filter.timestamp.$lte = new Date(query.endDate);
        }
      }

      // Search filter
      if (query.search) {
        filter.$or = [
          { message: { $regex: query.search, $options: 'i' } },
          { agent_name: { $regex: query.search, $options: 'i' } }
        ];
      }

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Sorting
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      // Execute query
      const [threads, total] = await Promise.all([
        ThreadsModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        ThreadsModel.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: threads.map((thread: any) => documentToThreads(thread)),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };

    } catch (error) {
      console.error('Error fetching threads:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          total: 0,
          totalPages: 0
        },
        error: 'Failed to fetch threads'
      };
    }
  }

  static async getThreadById(id: number): Promise<ApiResponse<Threads>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      const thread = await ThreadsModel.findOne({ id }).lean().exec();

      if (!thread) {
        return {
          success: false,
          error: 'Thread not found'
        };
      }

      return {
        success: true,
        data: documentToThreads(thread as any)
      };

    } catch (error) {
      console.error('Error fetching thread by id:', error);
      return {
        success: false,
        error: 'Failed to fetch thread'
      };
    }
  }

  static async getThreadsByUserAndProject(
    user_id: number,
    project_id: number,
    query?: PaginationParams
  ): Promise<PaginatedResponse<Threads>> {
    const threadsQuery: GetThreadsQuery = {
      user_id,
      project_id,
      ...query
    };

    return this.getAllThreads(threadsQuery);
  }

  static async createThread(data: CreateThreadRequest): Promise<ApiResponse<Threads>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Generate a unique ID
      const lastThread = await ThreadsModel.findOne().sort({ id: -1 }).exec();
      const newId = lastThread ? lastThread.id + 1 : 1;

      const threadData: Threads = {
        id: newId,
        index: data.index,
        user_id: data.user_id,
        project_id: data.project_id,
        role: data.role,
        message_type: data.message_type,
        message: data.message,
        timestamp: data.timestamp || new Date(),
        agent_name: data.agent_name
      };

      const newThread = new ThreadsModel(threadData);
      await newThread.save();

      return {
        success: true,
        data: threadData,
        message: 'Thread created successfully'
      };

    } catch (error) {
      console.error('Error creating thread:', error);
      return {
        success: false,
        error: 'Failed to create thread'
      };
    }
  }

  static async updateThread(id: number, data: UpdateThreadRequest): Promise<ApiResponse<Threads>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      const updateData: any = { ...data };
      delete updateData.id; // Don't allow updating the ID

      const updatedThread = await ThreadsModel.findOneAndUpdate(
        { id },
        updateData,
        { new: true, runValidators: true }
      ).lean().exec();

      if (!updatedThread) {
        return {
          success: false,
          error: 'Thread not found'
        };
      }

      return {
        success: true,
        data: documentToThreads(updatedThread as any),
        message: 'Thread updated successfully'
      };

    } catch (error) {
      console.error('Error updating thread:', error);
      return {
        success: false,
        error: 'Failed to update thread'
      };
    }
  }

  static async deleteThread(id: number): Promise<ApiResponse<void>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      const deletedThread = await ThreadsModel.findOneAndDelete({ id }).exec();

      if (!deletedThread) {
        return {
          success: false,
          error: 'Thread not found'
        };
      }

      return {
        success: true,
        message: 'Thread deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting thread:', error);
      return {
        success: false,
        error: 'Failed to delete thread'
      };
    }
  }

  static async deleteThreadsByProject(project_id: number): Promise<ApiResponse<void>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      const result = await ThreadsModel.deleteMany({ project_id }).exec();

      return {
        success: true,
        message: `Deleted ${result.deletedCount} threads for project ${project_id}`
      };

    } catch (error) {
      console.error('Error deleting threads by project:', error);
      return {
        success: false,
        error: 'Failed to delete threads'
      };
    }
  }

  static async deleteThreadsByUser(user_id: number): Promise<ApiResponse<void>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      const result = await ThreadsModel.deleteMany({ user_id }).exec();

      return {
        success: true,
        message: `Deleted ${result.deletedCount} threads for user ${user_id}`
      };

    } catch (error) {
      console.error('Error deleting threads by user:', error);
      return {
        success: false,
        error: 'Failed to delete threads'
      };
    }
  }

  static async getThreadStats(): Promise<ApiResponse<any>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      const stats = await ThreadsModel.aggregate([
        {
          $group: {
            _id: null,
            total_threads: { $sum: 1 },
            unique_users: { $addToSet: '$user_id' },
            unique_projects: { $addToSet: '$project_id' },
            role_distribution: {
              $push: '$role'
            },
            message_type_distribution: {
              $push: '$message_type'
            }
          }
        },
        {
          $project: {
            _id: 0,
            total_threads: 1,
            unique_users_count: { $size: '$unique_users' },
            unique_projects_count: { $size: '$unique_projects' },
            role_distribution: 1,
            message_type_distribution: 1
          }
        }
      ]);

      return {
        success: true,
        data: stats[0] || {
          total_threads: 0,
          unique_users_count: 0,
          unique_projects_count: 0,
          role_distribution: [],
          message_type_distribution: []
        }
      };

    } catch (error) {
      console.error('Error getting thread stats:', error);
      return {
        success: false,
        error: 'Failed to get thread statistics'
      };
    }
  }
}
