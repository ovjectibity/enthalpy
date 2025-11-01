import { ProductContext, ApiResponse } from '@enthalpy/shared';
import { ProductContextModel, documentToProductContext } from './productContextModel.js';
import { MongoDBConnections } from './mongoConnect.js';

export class ProductContextService {
  // 1. Get all product contexts for a given user_id and project_id
  static async getProductContextsByProjectAndUser(
    projectId: number,
    userId: number
  ): Promise<ApiResponse<ProductContext[]>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Find all ProductContext entries for this project and user
      const productContexts = await ProductContextModel.find({
        project_id: projectId,
        user_id: userId
      })
      .sort({ index: 1 })
      .lean()
      .exec();

      // Convert to ProductContext interface
      const contexts: ProductContext[] = productContexts.map(doc => documentToProductContext(doc));

      return {
        success: true,
        data: contexts
      };

    } catch (error) {
      console.error('Error getting product contexts by project and user:', error);
      return {
        success: false,
        error: 'Failed to get product contexts'
      };
    }
  }

  // 2. Add new product contexts to the collection
  static async addProductContexts(
    contexts: ProductContext[]
  ): Promise<ApiResponse<ProductContext[]>> {
    try {
      // Ensure MongoDB connection
      if (!MongoDBConnections.getConnection()) {
        await MongoDBConnections.initializeConnection();
      }

      // Convert ProductContext array to MongoDB documents
      const documentsToInsert = contexts.map(ctx => ProductContextModel.toDocuments(ctx));

      // Insert the documents
      await ProductContextModel.insertMany(documentsToInsert);

      return {
        success: true,
        data: contexts,
        message: 'Product contexts added successfully'
      };

    } catch (error) {
      console.error('Error adding product contexts:', error);
      return {
        success: false,
        error: 'Failed to add product contexts'
      };
    }
  }
}
