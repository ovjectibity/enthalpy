import mongoose, { Schema, Document, Model } from 'mongoose';
import { ThreadMessage } from '@enthalpy/shared';

// Create a separate interface for the MongoDB document
// We'll use a custom 'id' field and disable the default '_id' behavior
export interface IThreadsDocument extends Document {
  id: number;
  index: number;
  user_id: number;
  project_id: number;
  role: "agent" | "user" | "tool_result";
  message_type: "static" | "thinking" | "tool-use" | "enth-actions";
  message: string;
  timestamp: Date;
  agent_name: string;
}

// Interface for static methods
interface IThreadsModel extends Model<IThreadsDocument> {
  toThreads(doc: any): ThreadMessage;
}

const ThreadsSchema = new Schema<IThreadsDocument>({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  index: {
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
    required: true
  }
}, {
  collection: 'threads',
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
ThreadsSchema.index({ user_id: 1 });
ThreadsSchema.index({ project_id: 1 });
ThreadsSchema.index({ user_id: 1, project_id: 1 });
ThreadsSchema.index({ timestamp: -1 });
ThreadsSchema.index({ id: 1 }, { unique: true });

// Static utility method to convert plain object to Threads interface
ThreadsSchema.statics.toThreads = function(doc: any): ThreadMessage {
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
};

export const ThreadsModel = mongoose.model<IThreadsDocument, IThreadsModel>('Threads', ThreadsSchema);

// Export utility function for converting lean query results
export const documentToThreads = (doc: any): ThreadMessage => ThreadsModel.toThreads(doc);
