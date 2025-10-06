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
} from "./types.js";

export class HypothesesService {
  // Mock database - replace with actual database operations
  private static mockHypotheses: Hypothesis[] = [
    {
      id: "1",
      title: "Onboarding Flow Optimization",
      action: "Implement user onboarding flow",
      rationale: "New users are dropping off during signup process",
      expectedOutcome: "Increase user conversion rate by 25%",
      userId: "user_123",
      objectives: [
        {
          id: "obj_1",
          title: "Improve User Acquisition",
          userId: "user_123",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
        {
          id: "obj_2",
          title: "Reduce Signup Friction",
          userId: "user_123",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
      ],
      experiments: [
        {
          id: "exp_1",
          name: "A/B Test Welcome Screen",
          key: "onboarding_welcome_ab",
          status: "PENDING_DESIGN",
          hypothesisId: "1",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
        {
          id: "exp_2",
          name: "Progressive Disclosure Test",
          key: "onboarding_progressive_disclosure",
          status: "PENDING_DESIGN",
          hypothesisId: "1",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
      ],
      metrics: [
        {
          id: "met_1",
          name: "User Conversion Rate",
          formula: "(Converted Users / Total Signups) * 100",
          category: "Activation",
          hypothesisId: "1",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
        {
          id: "met_2",
          name: "Time to First Value",
          formula: "Average(Time from Signup to First Key Action)",
          category: "Activation",
          hypothesisId: "1",
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
      ],
      feedback: [],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      title: "Payment Process Simplification",
      action: "Reduce checkout steps from 5 to 3",
      rationale: "Cart abandonment is high at payment stage",
      expectedOutcome: "Decrease cart abandonment by 15%",
      userId: "user_123",
      objectives: [
        {
          id: "obj_3",
          title: "Optimize Revenue Per User",
          userId: "user_123",
          createdAt: new Date("2024-01-16"),
          updatedAt: new Date("2024-01-16"),
        },
      ],
      experiments: [
        {
          id: "exp_3",
          name: "Single Page Checkout",
          key: "payment_single_page",
          status: "PENDING_DESIGN",
          hypothesisId: "2",
          createdAt: new Date("2024-01-16"),
          updatedAt: new Date("2024-01-16"),
        },
      ],
      metrics: [
        {
          id: "met_3",
          name: "Cart Abandonment Rate",
          formula: "1 - (Purchases / Cart Additions)",
          category: "Revenue",
          hypothesisId: "2",
          createdAt: new Date("2024-01-16"),
          updatedAt: new Date("2024-01-16"),
        },
      ],
      feedback: [],
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
    },
  ];

  static async getHypothesesByUser(
    query: GetHypothesesQuery,
  ): Promise<PaginatedResponse<Hypothesis>> {
    try {
      let filteredHypotheses = this.mockHypotheses.filter(
        (h) => h.userId === query.userId,
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
    id: string,
    userId: string,
  ): Promise<ApiResponse<Hypothesis>> {
    try {
      const hypothesis = this.mockHypotheses.find(
        (h) => h.id === id && h.userId === userId,
      );

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
    userId: string,
    data: CreateHypothesisRequest,
  ): Promise<ApiResponse<Hypothesis>> {
    try {
      const newHypothesis: Hypothesis = {
        id: `hyp_${Date.now()}`,
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

      this.mockHypotheses.push(newHypothesis);

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
    id: string,
    userId: string,
    data: UpdateHypothesisRequest,
  ): Promise<ApiResponse<Hypothesis>> {
    try {
      const hypothesisIndex = this.mockHypotheses.findIndex(
        (h) => h.id === id && h.userId === userId,
      );

      if (hypothesisIndex === -1) {
        return {
          success: false,
          error: "Hypothesis not found",
        };
      }

      const existingHypothesis = this.mockHypotheses[hypothesisIndex];
      const updatedHypothesis: Hypothesis = {
        ...existingHypothesis,
        ...data,
        updatedAt: new Date(),
      };

      this.mockHypotheses[hypothesisIndex] = updatedHypothesis;

      return {
        success: true,
        data: updatedHypothesis,
        message: "Hypothesis updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to update hypothesis",
      };
    }
  }

  static async deleteHypothesis(
    id: string,
    userId: string,
  ): Promise<ApiResponse<void>> {
    try {
      const hypothesisIndex = this.mockHypotheses.findIndex(
        (h) => h.id === id && h.userId === userId,
      );

      if (hypothesisIndex === -1) {
        return {
          success: false,
          error: "Hypothesis not found",
        };
      }

      this.mockHypotheses.splice(hypothesisIndex, 1);

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

  static async getHypothesesStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const userHypotheses = this.mockHypotheses.filter(
        (h) => h.userId === userId,
      );

      const stats = {
        total: userHypotheses.length,
        totalExperiments: userHypotheses.reduce(
          (sum, h) => sum + h.experiments.length,
          0,
        ),
        totalMetrics: userHypotheses.reduce(
          (sum, h) => sum + h.metrics.length,
          0,
        ),
        feedbackStats: {
          positive: userHypotheses.reduce(
            (sum, h) =>
              sum + h.feedback.filter((f) => f.rating === "positive").length,
            0,
          ),
          negative: userHypotheses.reduce(
            (sum, h) =>
              sum + h.feedback.filter((f) => f.rating === "negative").length,
            0,
          ),
        },
        recentlyCreated: userHypotheses
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5)
          .map((h) => ({ id: h.id, title: h.title, createdAt: h.createdAt })),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch hypotheses statistics",
      };
    }
  }
}
