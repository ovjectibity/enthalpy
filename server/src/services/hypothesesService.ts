import {
  Hypothesis,
  CreateHypothesisRequest,
  UpdateHypothesisRequest,
  GetHypothesesQuery,
  PaginatedResponse,
  ApiResponse,
  Objective,
  Experiment,
  Metric,
  Feedback,
} from "@enthalpy/shared";
import { queryUtilities, ormUtilities } from "./orm.js";

import { DatabaseConnections } from "./dbconnect.js";
DatabaseConnections.initializePools();

export class HypothesesService {
  static async getHypothesesByUser(
    query: GetHypothesesQuery,
  ): Promise<PaginatedResponse<Hypothesis>> {
    try {
      let filteredHypotheses = await queryUtilities.getHypothesesByUserId(
        query.userId,
      );

      // Apply search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filteredHypotheses = filteredHypotheses.filter(
          (h) =>
            h.title.toLowerCase().includes(searchLower) ||
            h.action.toLowerCase().includes(searchLower) ||
            h.rationale.toLowerCase().includes(searchLower),
        );
      }

      // Apply objective filter
      if (query.objectiveId) {
        filteredHypotheses = filteredHypotheses.filter((h) =>
          h.objectives.some((obj) => obj.id === query.objectiveId),
        );
      }

      // Apply date filters
      if (query.startDate) {
        const startDate = new Date(query.startDate);
        filteredHypotheses = filteredHypotheses.filter(
          (h) => h.createdAt >= startDate,
        );
      }

      if (query.endDate) {
        const endDate = new Date(query.endDate);
        filteredHypotheses = filteredHypotheses.filter(
          (h) => h.createdAt <= endDate,
        );
      }

      // Apply sorting
      const sortBy = query.sortBy || "createdAt";
      const sortOrder = query.sortOrder || "desc";

      filteredHypotheses.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
          case "title":
            aValue = a.title;
            bValue = b.title;
            break;
          case "updatedAt":
            aValue = a.updatedAt;
            bValue = b.updatedAt;
            break;
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedResults = filteredHypotheses.slice(startIndex, endIndex);
      const total = filteredHypotheses.length;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          total: 0,
          totalPages: 0,
        },
        error: "Failed to fetch hypotheses",
      };
    }
  }

  static async getHypothesisById(
    id: number,
    userId: number,
  ): Promise<ApiResponse<Hypothesis>> {
    try {
      let hypotheses = await queryUtilities.getHypothesesByUserId(userId);
      let hypothesis;
      hypotheses.filter((h) => {
        if (h.id === id) {
          hypothesis = h;
        }
      });

      if (!hypothesis) {
        return {
          success: false,
          error: "Hypothesis not found",
        };
      }

      return {
        success: true,
        data: hypothesis,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch hypothesis",
      };
    }
  }

  static async createHypothesis(
    userId: number,
    data: CreateHypothesisRequest,
  ): Promise<ApiResponse<Hypothesis>> {
    try {
      const newHypothesis: Hypothesis = {
        id: Math.random(),
        title: data.title,
        action: data.action,
        rationale: data.rationale,
        expectedOutcome: data.expectedOutcome,
        userId,
        objectives: [], // Would populate from objectiveIds in real implementation
        experiments: [],
        metrics: [],
        feedback: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryUtilities.createHypothesis(userId, newHypothesis);

      return {
        success: true,
        data: newHypothesis,
        message: "Hypothesis created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to create hypothesis",
      };
    }
  }

  static async updateHypothesis(
    id: number,
    userId: number,
    data: UpdateHypothesisRequest,
  ): Promise<ApiResponse<Hypothesis>> {
    try {
      let hypotheses = await queryUtilities.getHypothesesByUserId(userId);
      let hypothesis: Hypothesis | null = null;
      hypotheses.filter((h) => {
        if (h.id === id) {
          hypothesis = h;
        }
      });
      if (hypothesis === null) {
        return {
          success: false,
          error: "Hypothesis not found",
        };
      }
      let h = hypothesis as Hypothesis;
      h.title = data.title ? data.title : h.title;
      h.action = data.action ? data.action : h.action;
      h.rationale = data.rationale ? data.rationale : h.rationale;
      h.expectedOutcome = data.expectedOutcome
        ? data.expectedOutcome
        : h.expectedOutcome;

      let updatedHypothesis = await queryUtilities.updateHypothesis(userId, h);
      if (updatedHypothesis === null) {
        return {
          success: false,
          error: "Failed to update hypothesis",
        };
      } else {
        return {
          success: true,
          data: updatedHypothesis,
          message: "Hypothesis updated successfully",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: "Failed to update hypothesis",
      };
    }
  }

  static async deleteHypothesis(
    id: number,
    userId: number,
  ): Promise<ApiResponse<void>> {
    try {
      queryUtilities.deleteHypothesis(id);

      return {
        success: true,
        message: "Hypothesis deleted successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to delete hypothesis",
      };
    }
  }
}
