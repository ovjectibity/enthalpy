import express, { Request, Response } from "express";
import { HypothesesService } from "../services/hypothesesService.js";
import {
  GetHypothesesQuery,
  CreateHypothesisRequest,
  UpdateHypothesisRequest,
  CreateFeedbackRequest,
} from "@enthalpy/shared";

const router = express.Router();

// GET /api/hypotheses - Get all hypotheses for a user with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const query: GetHypothesesQuery = {
      userId: req.query.userId as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as "asc" | "desc",
      search: req.query.search as string,
      objectiveId: req.query.objectiveId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    // Validate required userId parameter
    if (!query.userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const result = await HypothesesService.getHypothesesByUser(query);

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

// GET /api/hypotheses/:id - Get a specific hypothesis by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const result = await HypothesesService.getHypothesisById(id, userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/hypotheses - Create a new hypothesis
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId as string;
    const hypothesisData: CreateHypothesisRequest = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    // Validate required fields
    const requiredFields = ["title", "action", "rationale", "expectedOutcome"];
    const missingFields = requiredFields.filter(
      (field) => !hypothesisData[field as keyof CreateHypothesisRequest],
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const result = await HypothesesService.createHypothesis(
      userId,
      hypothesisData,
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// PUT /api/hypotheses/:id - Update an existing hypothesis
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId as string;
    const updateData: UpdateHypothesisRequest = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const result = await HypothesesService.updateHypothesis(
      id,
      userId,
      updateData,
    );

    if (!result.success) {
      const statusCode = result.error === "Hypothesis not found" ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// DELETE /api/hypotheses/:id - Delete a hypothesis
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const result = await HypothesesService.deleteHypothesis(id, userId);

    if (!result.success) {
      const statusCode = result.error === "Hypothesis not found" ? 404 : 500;
      return res.status(statusCode).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/hypotheses/:id/feedback - Add feedback to a hypothesis
router.post("/:id/feedback", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId as string;
    const feedbackData: CreateFeedbackRequest = {
      ...req.body,
      assetType: "hypothesis",
      assetId: id,
    };

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    // Validate required feedback fields
    if (
      !feedbackData.rating ||
      !["positive", "negative"].includes(feedbackData.rating)
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid rating (positive or negative) is required",
      });
    }

    // For now, just return success - implement actual feedback storage later
    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        id: `feedback_${Date.now()}`,
        ...feedbackData,
        userId,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
