import express, { Request, Response } from "express";
import { ProductContextService } from "../services/productContextService.js";

const router = express.Router();

// GET /api/context - Get all product contexts for a user and project
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.query.user_id as string);
    const projectId = parseInt(req.query.project_id as string);

    // Validate required parameters
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "user_id is required",
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "project_id is required",
      });
    }

    const result = await ProductContextService.getProductContextsByProjectAndUser(
      projectId,
      userId
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
