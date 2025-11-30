import express, { Request, Response } from "express";
import { queryUtilities } from "../services/orm.js";

const router = express.Router();

// GET /api/metrics/:project_id - Get all metrics for a project
router.get("/:project_id", async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.project_id as string);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project_id",
      });
    }

    const metrics = await queryUtilities.getMetricsByProjectId(projectId);

    console.log("DEBUG: Returning the following metrics for the API: ",projectId, metrics.length);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching metrics by project ID:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
