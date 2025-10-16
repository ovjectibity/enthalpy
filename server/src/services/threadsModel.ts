import mongoose, { Schema, Document } from 'mongoose';
import { Threads } from '@enthalpy/shared';

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

// Helper method to convert document to Threads interface
ThreadsSchema.methods.toThreads = function(): Threads {
  return {
    id: this.id,
    index: this.index,
    user_id: this.user_id,
    project_id: this.project_id,
    role: this.role,
    message_type: this.message_type,
    message: this.message,
    timestamp: this.timestamp,
    agent_name: this.agent_name
  };
};

export const ThreadsModel = mongoose.model<IThreadsDocument>('Threads', ThreadsSchema);
