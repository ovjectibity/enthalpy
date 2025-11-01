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

      // Find the current max index in the collection
      const maxIndexDoc = await ProductContextModel.findOne()
        .sort({ index: -1 })
        .select('index')
        .lean()
        .exec();

      // Start from max index + 1, or 0 if collection is empty
      let nextIndex = maxIndexDoc ? maxIndexDoc.index + 1 : 0;

      // Replace all indices with unique incremental indices
      const contextsWithNewIndices = contexts.map(ctx => ({
        ...ctx,
        index: nextIndex++
      }));

      // Convert ProductContext array to MongoDB documents
      const documentsToInsert = contextsWithNewIndices.map(ctx => ProductContextModel.toDocuments(ctx));

      // Insert the documents
      await ProductContextModel.insertMany(documentsToInsert);

      return {
        success: true,
        data: contextsWithNewIndices,
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
