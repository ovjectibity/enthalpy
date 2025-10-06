export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experiment {
  id: string;
  name: string;
  key: string;
  status:
    | "PENDING_DESIGN"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PAUSED"
    | "CANCELLED";
  description?: string;
  hypothesisId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Metric {
  id: string;
  name: string;
  formula: string;
  category: "Acquisition" | "Activation" | "Retention" | "Referral" | "Revenue";
  description?: string;
  hypothesisId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  rating: "positive" | "negative";
  comment?: string;
  assetType: "hypothesis" | "experiment" | "objective" | "metric";
  assetId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hypothesis {
  id: string;
  title: string;
  action: string;
  rationale: string;
  expectedOutcome: string;
  userId: string;
  objectives: Objective[];
  experiments: Experiment[];
  metrics: Metric[];
  feedback: Feedback[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Request types
export interface CreateHypothesisRequest {
  title: string;
  action: string;
  rationale: string;
  expectedOutcome: string;
  objectiveIds?: string[];
}

export interface UpdateHypothesisRequest {
  title?: string;
  action?: string;
  rationale?: string;
  expectedOutcome?: string;
  objectiveIds?: string[];
}

export interface CreateFeedbackRequest {
  rating: "positive" | "negative";
  comment?: string;
  assetType: "hypothesis" | "experiment" | "objective" | "metric";
  assetId: string;
}

export interface GetHypothesesQuery extends PaginationParams {
  userId: string;
  search?: string;
  objectiveId?: string;
  startDate?: string;
  endDate?: string;
}
