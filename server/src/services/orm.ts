import { Hypothesis, Objective, Experiment, Metric, User } from "./types.js";
import { DatabaseConnections } from "./dbconnect.js";

const assetsPool = DatabaseConnections.getAssetsPool();
const commonPool = DatabaseConnections.getCommonPool();

// ORM conversion functions
export const ormUtilities = {
  /**
   * Convert PostgreSQL user row to User interface
   */
  toUser(row: any): User {
    return {
      id: String(row.user_id),
      email: String(row.email),
      name: row.first_name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_updated_at),
    };
  },

  /**
   * Convert PostgreSQL objectives row to Objective interface
   */
  toObjective(row: any): Objective {
    return {
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : undefined,
      userId: String(row.user_id),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_updated_at),
    };
  },

  /**
   * Convert PostgreSQL experiments row to Experiment interface
   */
  toExperiment(row: any): Experiment {
    // Map database status to interface status
    const statusMap: Record<string, Experiment["status"]> = {
      PENDING_DESIGN: "PENDING_DESIGN",
      IN_PROGRESS: "IN_PROGRESS",
      COMPLETED: "COMPLETED",
      PAUSED: "PAUSED",
      CANCELLED: "CANCELLED",
    };

    return {
      id: String(row.id),
      name: String(row.title), // SQL uses 'title', interface uses 'name'
      key: String(row.id), // Using id as key since no separate key field in SQL
      status: statusMap[row.status] || "PENDING_DESIGN",
      description: row.plan ? String(row.plan) : undefined, // SQL uses 'plan' for description
      hypothesisId:
        row.linked_hypotheses && row.linked_hypotheses.length > 0
          ? String(row.linked_hypotheses[0])
          : "", // Taking first linked hypothesis as primary
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_updated_at),
    };
  },

  /**
   * Convert PostgreSQL metrics row to Metric interface
   */
  toMetric(row: any): Metric {
    // Default category since SQL doesn't have this field
    const defaultCategory: Metric["category"] = "Acquisition";

    return {
      id: String(row.id),
      name: String(row.title), // SQL uses 'title', interface uses 'name'
      formula: String(row.formula),
      category: defaultCategory, // SQL schema doesn't have category field
      description: row.description ? String(row.description) : undefined,
      hypothesisId: "", // SQL schema doesn't have direct hypothesis link
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_updated_at),
    };
  },

  /**
   * Convert PostgreSQL hypotheses row to Hypothesis interface (without nested objects)
   */
  toHypothesis(row: any): Hypothesis {
    return {
      id: String(row.id),
      title: String(row.title),
      action: String(row.action),
      rationale: String(row.rationale),
      expectedOutcome: String(row.expected_outcome),
      userId: String(row.user_target), // SQL uses user_target as userId reference
      objectives: [], // Empty arrays - populate separately if needed
      experiments: [],
      metrics: [],
      feedback: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_updated_at),
    };
  },

  /**
   * Convert array of PostgreSQL user rows to User array
   */
  toUsers(rows: any[]): User[] {
    return rows.map(this.toUser);
  },

  /**
   * Convert array of PostgreSQL objectives rows to Objective array
   */
  toObjectives(rows: any[]): Objective[] {
    return rows.map(this.toObjective);
  },

  /**
   * Convert array of PostgreSQL experiments rows to Experiment array
   */
  toExperiments(rows: any[]): Experiment[] {
    return rows.map(this.toExperiment);
  },

  /**
   * Convert array of PostgreSQL metrics rows to Metric array
   */
  toMetrics(rows: any[]): Metric[] {
    return rows.map(this.toMetric);
  },

  /**
   * Convert array of PostgreSQL hypotheses rows to Hypothesis array
   */
  toHypotheses(rows: any[]): Hypothesis[] {
    return rows.map(this.toHypothesis);
  },
};

export const queryUtilities = {
  // ==========================================
  // USER FUNCTIONS
  // ==========================================

  /**
   * Fetch user by user ID
   */
  async getUserByUserId(userId: string): Promise<User | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [userId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return ormUtilities.toUser(result.rows[0]);
    } catch (error) {
      console.error("Error fetching user by user ID:", error);
      throw error;
    }
  },

  // ==========================================
  // OBJECTIVE FUNCTIONS
  // ==========================================

  /**
   * Fetch objective by ID
   */
  async getObjectiveById(objectiveId: string): Promise<Objective | null> {
    try {
      const result = await assetsPool.query(
        "SELECT * FROM objectives WHERE id = $1",
        [objectiveId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return ormUtilities.toObjective(result.rows[0]);
    } catch (error) {
      console.error("Error fetching objective by ID:", error);
      throw error;
    }
  },

  /**
   * Fetch objectives by user ID
   */
  async getObjectivesByUserId(userId: string): Promise<Objective[]> {
    try {
      const result = await assetsPool.query(
        "SELECT * FROM objectives WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      );

      return ormUtilities.toObjectives(result.rows);
    } catch (error) {
      console.error("Error fetching objectives by user ID:", error);
      throw error;
    }
  },

  // ==========================================
  // EXPERIMENT FUNCTIONS
  // ==========================================

  /**
   * Fetch experiment by ID
   */
  async getExperimentById(experimentId: string): Promise<Experiment | null> {
    try {
      const result = await assetsPool.query(
        "SELECT * FROM experiments WHERE id = $1",
        [experimentId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return ormUtilities.toExperiment(result.rows[0]);
    } catch (error) {
      console.error("Error fetching experiment by ID:", error);
      throw error;
    }
  },

  /**
   * Fetch experiments by user ID
   */
  async getExperimentsByUserId(userId: string): Promise<Experiment[]> {
    try {
      const result = await assetsPool.query(
        "SELECT * FROM experiments WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      );

      return ormUtilities.toExperiments(result.rows);
    } catch (error) {
      console.error("Error fetching experiments by user ID:", error);
      throw error;
    }
  },

  // ==========================================
  // METRIC FUNCTIONS
  // ==========================================

  /**
   * Fetch metric by ID
   */
  async getMetricById(metricId: string): Promise<Metric | null> {
    try {
      const result = await assetsPool.query(
        "SELECT * FROM metrics WHERE id = $1",
        [metricId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return ormUtilities.toMetric(result.rows[0]);
    } catch (error) {
      console.error("Error fetching metric by ID:", error);
      throw error;
    }
  },

  /**
   * Fetch metrics by user ID (via hypothesis relationship)
   * Note: Since metrics don't have direct user_id, we join through hypotheses
   */
  async getMetricsByUserId(userId: string): Promise<Metric[]> {
    try {
      const result = await assetsPool.query(
        `
        SELECT m.* FROM metrics m
        JOIN hypotheses h ON m.id = ANY(h.linked_metrics)
        WHERE h.user_target = (
          SELECT email FROM users WHERE user_id = $1
        )
        ORDER BY m.created_at DESC
      `,
        [userId],
      );

      return ormUtilities.toMetrics(result.rows);
    } catch (error) {
      console.error("Error fetching metrics by user ID:", error);
      throw error;
    }
  },

  // ==========================================
  // HYPOTHESIS FUNCTIONS
  // ==========================================

  /**
   * Fetch hypothesis by ID
   */
  async getHypothesisById(hypothesisId: string): Promise<Hypothesis | null> {
    try {
      const result = await assetsPool.query(
        "SELECT * FROM hypotheses WHERE id = $1",
        [hypothesisId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return ormUtilities.toHypothesis(result.rows[0]);
    } catch (error) {
      console.error("Error fetching hypothesis by ID:", error);
      throw error;
    }
  },

  /**
   * Fetch hypotheses by user ID (using email as user_target)
   */
  async getHypothesesByUserId(userId: string): Promise<Hypothesis[]> {
    try {
      // First, get user's email from common database
      const userResult = await commonPool.query(
        "SELECT email FROM users WHERE user_id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return [];
      }

      const userEmail = userResult.rows[0].email;

      // Then, get hypotheses by user_target (email)
      const result = await assetsPool.query(
        "SELECT * FROM hypotheses WHERE user_target = $1 ORDER BY created_at DESC",
        [userEmail],
      );

      return ormUtilities.toHypotheses(result.rows);
    } catch (error) {
      console.error("Error fetching hypotheses by user ID:", error);
      throw error;
    }
  },

  /**
   * Delete an existing hypothesis
   */
  async deleteHypothesis(hypothesisId: string): Promise<boolean> {
    try {
      // Check if hypothesis exists first
      const checkResult = await assetsPool.query(
        "SELECT id FROM hypotheses WHERE id = $1",
        [hypothesisId],
      );

      if (checkResult.rows.length === 0) {
        return false; // Hypothesis doesn't exist
      }

      // TODO: You might want to handle related data cleanup here
      // For example, update experiments that link to this hypothesis

      // Delete the hypothesis
      const result = await assetsPool.query(
        "DELETE FROM hypotheses WHERE id = $1",
        [hypothesisId],
      );

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting hypothesis:", error);
      throw error;
    }
  },

  /**
   * Create a new hypothesis
   */
  async createHypothesis(
    userId: string,
    hypothesisData: Hypothesis,
  ): Promise<Hypothesis> {
    try {
      // Insert hypothesis into assets database
      const result = await assetsPool.query(
        `
        INSERT INTO hypotheses (
          title,
          action,
          expected_outcome,
          rationale,
          user_target,
          linked_objectives,
          linked_experiments,
          linked_context,
          linked_metrics
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
        [
          hypothesisData.title,
          hypothesisData.action,
          hypothesisData.expectedOutcome,
          hypothesisData.rationale,
          "",
          [], // linked_objectives
          [], // linked_experiments (empty for new hypothesis)
          [], // linked_context (empty for new hypothesis)
          [], // linked_metrics (empty for new hypothesis)
        ],
      );

      return ormUtilities.toHypothesis(result.rows[0]);
    } catch (error) {
      console.error("Error creating hypothesis:", error);
      throw error;
    }
  },

  async updateHypothesis(
    hypothesisId: string,
    hypothesisData: Hypothesis,
  ): Promise<Hypothesis | null> {
    const assetsPool = DatabaseConnections.getAssetsPool();

    try {
      // Replace all fields with new data (except ID and timestamps)
      const result = await assetsPool.query(
        `
          UPDATE hypotheses
          SET
            title = $1,
            action = $2,
            expected_outcome = $3,
            rationale = $4,
            linked_objectives = $5,
            linked_experiments = $6,
            linked_context = $7,
            linked_metrics = $8,
            last_updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
          RETURNING *
        `,
        [
          hypothesisData.title,
          hypothesisData.action,
          hypothesisData.expectedOutcome,
          hypothesisData.rationale,
          [],
          [], // Reset linked_experiments
          [], // Reset linked_context
          [], // Reset linked_metrics
          hypothesisId,
        ],
      );

      if (result.rows.length === 0) {
        return null; // Hypothesis not found
      }

      return ormUtilities.toHypothesis(result.rows[0]);
    } catch (error) {
      console.error("Error updating hypothesis:", error);
      throw error;
    }
  },
};

// ==========================================
// BATCH FUNCTIONS (Bonus)
// ==========================================

export const batchQueryUtilities = {
  /**
   * Get all user assets by user ID
   */
  async getAllAssetsByUserId(userId: string): Promise<{
    user: User | null;
    objectives: Objective[];
    experiments: Experiment[];
    metrics: Metric[];
    hypotheses: Hypothesis[];
  }> {
    try {
      const [user, objectives, experiments, metrics, hypotheses] =
        await Promise.all([
          queryUtilities.getUserByUserId(userId),
          queryUtilities.getObjectivesByUserId(userId),
          queryUtilities.getExperimentsByUserId(userId),
          queryUtilities.getMetricsByUserId(userId),
          queryUtilities.getHypothesesByUserId(userId),
        ]);

      return {
        user,
        objectives,
        experiments,
        metrics,
        hypotheses,
      };
    } catch (error) {
      console.error("Error fetching all assets by user ID:", error);
      throw error;
    }
  },
};
