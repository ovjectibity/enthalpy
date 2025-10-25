import mongoose, { Schema, Document, Model } from 'mongoose';
import { ThreadMessage } from '@enthalpy/shared';

// Create a separate interface for the MongoDB document
// We'll use a custom 'id' field and disable the default '_id' behavior
export interface IThreadMessageDocument extends Document {
  index: number;
  thread_idx: number;
  user_id: number;
  project_id: number;
  role: "agent" | "user" | "tool_result";
  message_type: "static" | "thinking" | "tool-use" | "enth-actions";
  message: string;
  timestamp: Date;
  agent_name: "mc" | "flow-graph" | "exp-design" | "hypotheses";
}

// Interface for static methods
interface IThreadMessageModel extends Model<IThreadMessageDocument> {
  toThreads(doc: any): ThreadMessage;
  toDocuments(msg: ThreadMessage): any;
}

const ThreadMessageSchema = new Schema<IThreadMessageDocument>({
  index: {
    type: Number,
    required: true,
    unique: true
  },
  thread_idx: {
    type: Number,
    required: true
  },
  user_id: {
    type: Number,
    required: true
  },
  project_id: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    enum: ['agent', 'user', 'tool_result'],
    required: true
  },
  message_type: {
    type: String,
    enum: ['static', 'thinking', 'tool-use', 'enth-actions'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  agent_name: {
    type: String,
    enum: ["mc", "flow-graph", "exp-design", "hypotheses"],
    required: true
  }
}, {
  collection: 'thread_message',
  timestamps: false, // We're managing timestamp manually
  toJSON: {
    transform: function(doc, ret) {
      // Remove MongoDB's _id and __v fields from JSON output
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Create indexes for better query performance
ThreadMessageSchema.index({ user_id: 1 });
ThreadMessageSchema.index({ project_id: 1 });
ThreadMessageSchema.index({ user_id: 1, project_id: 1 });
ThreadMessageSchema.index({ timestamp: -1 });
ThreadMessageSchema.index({ thread_idx: 1 });
ThreadMessageSchema.index({ index: 1 }, { unique: true });

// Static utility method to convert plain object to Threads interface
ThreadMessageSchema.statics.toThreads = function(doc: any): ThreadMessage {
  return {
    threadId: doc.thread_idx,
    index: doc.index,
    userId: doc.user_id,
    projectId: doc.project_id,
    role: doc.role,
    messageType: doc.message_type,
    message: doc.message,
    timestamp: doc.timestamp,
    agentName: doc.agent_name
  };
};

ThreadMessageSchema.statics.toDocuments = function(msg: ThreadMessage): any {
  return {
    thread_idx: msg.threadId,
    index: msg.index,
    user_id: msg.userId,
    project_id: msg.projectId,
    role: msg.role,
    message_type: msg.messageType,
    message: msg.message,
    timestamp: msg.timestamp,
    agent_name: msg.agentName
  };
};

export const ThreadMessageModel = mongoose.model<IThreadMessageDocument, IThreadMessageModel>('Threads', ThreadMessageSchema);

// Export utility function for converting lean query results
export const documentToThreads = (doc: any): ThreadMessage => ThreadMessageModel.toThreads(doc);
export const threadsToDocuments = (msg: ThreadMessage): any => ThreadMessageModel.toDocuments(msg);
