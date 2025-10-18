export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Objective {
  id: number;
  title: string;
  description?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Experiment {
  id: number;
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
  id: number;
  name: string;
  formula: string;
  category: "Acquisition" | "Activation" | "Retention" | "Referral" | "Revenue";
  description?: string;
  hypothesisId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: number;
  rating: "positive" | "negative";
  comment?: string;
  assetType: "hypothesis" | "experiment" | "objective" | "metric";
  assetId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Hypothesis {
  id: number;
  userId: number,
  title: string;
  action: string;
  rationale: string;
  expectedOutcome: string;
  objectives: Objective[];
  experiments: Experiment[];
  metrics: Metric[];
  feedback: Feedback[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadMessage {
  id: number,
  index: number,
  user_id: number
  project_id: number,
  role: "agent" | "user" | "tool_result"
  message_type: "static" | "thinking" | "tool-use" | "enth-actions";
  message: string
  timestamp: Date;
  agent_name: string;
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
  userId: number;
  search?: string;
  objectiveId?: number;
  startDate?: string;
  endDate?: string;
}
