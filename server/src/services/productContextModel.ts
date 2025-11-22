import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProductContext } from '@enthalpy/shared';

// Create a separate interface for the MongoDB document
// We'll use a custom 'id' field and disable the default '_id' behavior
export interface IProductContextDocument extends Document {
  index: number;
  user_id: number;
  project_id: number;
  created_at: Date;
  type: "product-page-url" | "product-documentation" | "product-context" | "product-name";
  content: string;
  description?: string;
  format: "url" | "text" | "doc";
}

// Interface for static methods
interface IProductContextModel extends Model<IProductContextDocument> {
  toProductContext(doc: any): ProductContext;
  toDocuments(ctx: ProductContext): any;
}

const ProductContextSchema = new Schema<IProductContextDocument>({
  index: {
    type: Number,
    required: true,
    unique: true
  },
  user_id: {
    type: Number,
    required: true
  },
  project_id: {
    type: Number,
    required: true
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ["product-page-url", "product-documentation", "product-context", "product-name"],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  format: {
    type: String,
    enum: ['url', 'text', 'doc'],
    required: true
  }
}, {
  collection: 'product_context',
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
ProductContextSchema.index({ user_id: 1 });
ProductContextSchema.index({ project_id: 1 });
ProductContextSchema.index({ user_id: 1, project_id: 1 });
ProductContextSchema.index({ created_at: -1 });
ProductContextSchema.index({ index: 1 }, { unique: true });

// Static utility method to convert plain object to ProductContext interface
ProductContextSchema.statics.toProductContext = function(doc: any): ProductContext {
  return {
    index: doc.index,
    userId: doc.user_id,
    projectId: doc.project_id,
    createdAt: doc.created_at,
    type: doc.type,
    content: doc.content,
    description: doc.description,
    format: doc.format
  };
};

ProductContextSchema.statics.toDocuments = function(ctx: ProductContext): any {
  return {
    index: ctx.index,
    user_id: ctx.userId,
    project_id: ctx.projectId,
    created_at: ctx.createdAt,
    type: ctx.type,
    content: ctx.content,
    description: ctx.description,
    format: ctx.format
  };
};

export const ProductContextModel = mongoose.model<IProductContextDocument, IProductContextModel>('ProductContext', ProductContextSchema);

// Export utility function for converting lean query results
export const documentToProductContext = (doc: any): ProductContext => ProductContextModel.toProductContext(doc);
export const productContextToDocuments = (ctx: ProductContext): any => ProductContextModel.toDocuments(ctx);
