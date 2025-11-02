import {
  Hypothesis,
  Objective,
  Experiment,
  Metric,
  User,
} from "@enthalpy/shared";
import { DatabaseConnections } from "./dbconnect.js";
import 'dotenv/config';

DatabaseConnections.initializePools();
const commonPool = DatabaseConnections.getDBPool();

// ORM conversion functions
export const ormUtilities = {
  /**
   * Convert PostgreSQL user row to User interface
   */
  toUser(row: any): User {
    return {
      id: Number(row.user_id),
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
      id: Number(row.id),
      projectId: Number(row.project_id),
      title: String(row.title),
      description: String(row.description),
      userId: Number(row.user_id),
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
      id: Number(row.id),
      projectId: Number(row.project_id),
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
    return {
      userId: Number(row.user_id),
      projectId: Number(row.project_id), 
      id: Number(row.id),
      name: String(row.title), // SQL uses 'title', interface uses 'name'
      formula: String(row.formula),
      description: row.description ? String(row.description) : "",
      hypothesesId: "", // SQL schema doesn't have direct hypothesis link
      priority: String(row.priority),
      metricTimeframe: String(row.metricTimeframe),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.last_updated_at),

    };
  },

  /**
   * Convert PostgreSQL hypotheses row to Hypothesis interface (without nested objects)
   */
  toHypothesis(row: any): Hypothesis {
    return {
      id: Number(row.id),
      projectId: Number(row.project_id), 
      title: String(row.title),
      action: String(row.action),
      rationale: String(row.rationale),
      expectedOutcome: String(row.expected_outcome),
      userId: Number(row.user_id),
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
  async getUserByUserId(userId: number): Promise<User | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM common.users WHERE user_id = $1",
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
  async getObjectiveById(objectiveId: number): Promise<Objective | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.objectives WHERE id = $1",
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
  async getObjectivesByUserId(userId: number): Promise<Objective[]> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.objectives WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
      );

      return ormUtilities.toObjectives(result.rows);
    } catch (error) {
      console.error("Error fetching objectives by user ID:", error);
      throw error;
    }
  },

  /**
   * Fetch objective by user ID and project ID
   */
  async getObjectiveByUserIdAndProjectId(
    userId: number,
    projectId: number
  ): Promise<Objective | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.objectives WHERE user_id = $1 AND project_id = $2 ORDER BY created_at DESC LIMIT 1",
        [userId, projectId],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return ormUtilities.toObjective(result.rows[0]);
    } catch (error) {
      console.error("Error fetching objective by user ID and project ID:", error);
      throw error;
    }
  },

  /**
   * Add a new objective
   */
  async addObjective(
    userId: number,
    projectId: number,
    title: string,
    description: string
  ): Promise<Objective> {
    try {
      const result = await commonPool.query(
        `
        INSERT INTO assets.objectives (
          user_id,
          project_id,
          title,
          description
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [userId, projectId, title, description],
      );

      return ormUtilities.toObjective(result.rows[0]);
    } catch (error) {
      console.error("Error adding objective:", error);
      throw error;
    }
  },

  // ==========================================
  // EXPERIMENT FUNCTIONS
  // ==========================================

  /**
   * Fetch experiment by ID
   */
  async getExperimentById(experimentId: number): Promise<Experiment | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.experiments WHERE id = $1",
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
  async getExperimentsByUserId(userId: number): Promise<Experiment[]> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.experiments WHERE user_id = $1 ORDER BY created_at DESC",
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
  async getMetricById(metricId: number): Promise<Metric | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.metrics WHERE id = $1",
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
  async getMetricsByUserId(userId: number): Promise<Metric[]> {
    try {
      const result = await commonPool.query(
        `
        SELECT m.* FROM assets.metrics m
        JOIN assets.hypotheses h ON m.id = ANY(h.linked_metrics)
        WHERE h.user_id = $1
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
  async getHypothesisById(hypothesisId: number): Promise<Hypothesis | null> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.hypotheses WHERE id = $1",
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
   * Fetch hypotheses by user ID
   */
  async getHypothesesByUserId(userId: number): Promise<Hypothesis[]> {
    try {
      const result = await commonPool.query(
        "SELECT * FROM assets.hypotheses WHERE user_id = $1 ORDER BY created_at DESC",
        [userId],
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
  async deleteHypothesis(hypothesisId: number): Promise<boolean> {
    try {
      // Check if hypothesis exists first
      const checkResult = await commonPool.query(
        "SELECT id FROM assets.hypotheses WHERE id = $1",
        [hypothesisId],
      );

      if (checkResult.rows.length === 0) {
        return false; // Hypothesis doesn't exist
      }

      // TODO: You might want to handle related data cleanup here
      // For example, update experiments that link to this hypothesis

      // Delete the hypothesis
      const result = await commonPool.query(
        "DELETE FROM assets.hypotheses WHERE id = $1",
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
    userId: number,
    hypothesisData: Hypothesis,
  ): Promise<Hypothesis> {
    try {
      // Insert hypothesis into assets database
      const result = await commonPool.query(
        `
        INSERT INTO assets.hypotheses (
          title,
          action,
          expected_outcome,
          rationale,
          user_id,
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
          userId,
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
    hypothesisId: number,
    hypothesisData: Hypothesis,
  ): Promise<Hypothesis | null> {
    try {
      // Replace all fields with new data (except ID and timestamps)
      const result = await commonPool.query(
        `
          UPDATE assets.hypotheses
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
  async getAllAssetsByUserId(userId: number): Promise<{
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
