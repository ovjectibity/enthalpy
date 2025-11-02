import { Objective, ApiResponse } from "@enthalpy/shared";
import { queryUtilities } from "./orm.js";

export class ObjectivesService {
  /**
   * Get the objective for a given user ID and project ID
   */
  static async getObjectiveByUserAndProject(
    userId: number,
    projectId: number
  ): Promise<ApiResponse<Objective>> {
    try {
      const objective = await queryUtilities.getObjectiveByUserIdAndProjectId(
        userId,
        projectId
      );

      if (!objective) {
        return {
          success: false,
          error: "Objective not found",
        };
      }

      return {
        success: true,
        data: objective,
      };
    } catch (error) {
      console.error("Error fetching objective:", error);
      return {
        success: false,
        error: "Failed to fetch objective",
      };
    }
  }

  /**
   * Add a new objective for a given user ID and project ID
   */
  static async addObjective(
    userId: number,
    projectId: number,
    title: string,
    description: string
  ): Promise<ApiResponse<Objective>> {
    try {
      const newObjective = await queryUtilities.addObjective(
        userId,
        projectId,
        title,
        description
      );

      return {
        success: true,
        data: newObjective,
        message: "Objective added successfully",
      };
    } catch (error) {
      console.error("Error adding objective:", error);
      return {
        success: false,
        error: "Failed to add objective",
      };
    }
  }
}
