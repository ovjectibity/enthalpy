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
  projectId: number;
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
  userId: number;
  projectId: number;
  name: string;
  formula: string;
  description: string;
  hypothesesId?: string;
  createdAt: Date;
  updatedAt: Date;
  priority: string;
  metricTimeframe: string;
}

export interface Feedback {
  id: number;
  projectId: number;
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
  projectId: number;
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
  threadId: number,
  index: number,
  userId: number,
  projectId: number,
  role: "agent" | "user" | "tool_result",
  messageType: "static" | "thinking" | "tool-use" | "enth-actions",
  //TODO: Handling for rich text here
  message: string,
  timestamp: Date,
  agentName: Agent
}

export interface Thread {
  threadId: number,
  //Assumption: ThreadMessage array is ordered by index,
  // index representing the order of messages
  messages: ThreadMessage[],
  userId: number,
  projectId: number,
  agentName: Agent,
  summary?: string
}

export interface ObjectiveContext {
  index: number,
  userId: number,
  projectId: number,
  createdAt: Date,
  content: string
}

export interface ProductContext {
  index: number,
  userId: number,
  projectId: number,
  createdAt: Date,
  type: "product-page-url" | "product-documentation" | "product-context-document" | "product-name",
  content: string,
  description?: string,
  format: "url" | "text" | "doc"
}

export interface TelemetryContext {
  semantics: string,
  tableName: string,
  databaseName: string,
  fields: {
    fieldName: string,
    dataType: string,
    semantics: string
  }[]
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

export interface ThreadActivation {
  threadId: number,
  agentName: Agent,
  projectId: number
}

export interface CreateThreadData {
  projectId: number;
  userId: number;
  agentName: Agent;
}

export interface AppendMessageData {
  role: ThreadMessage['role'];
  messageType: ThreadMessage['messageType'];
  agentName: Agent,
  message: string;
  timestamp?: Date;
  threadId: number,
  projectId: number
}

export interface Contexts<T> {
  contexts: T[]
}

export interface Assets<T> {
  assets: T[]
}

export interface AgentServerToClientEvents {
  agent_message: (msg: ThreadMessage) => void;
  add_user_message: (msg: ThreadMessage) => void;
  connectError: (err: Error) => void;
}

export interface AgentClientToServerEvents {
  user_message: (msg: AppendMessageData) => void;
  activate_thread: (msg: ThreadActivation) => void
}

export type Agent = "mc" | "flow-graph" | "exp-design" | "hypotheses";

export type ObjectiveContextO = Omit<ObjectiveContext, "index" | "userId" | "projectId" | "createdAt">;
export type ProductContextO = Omit<ProductContext, "index" | "userId" | "projectId" | "createdAt">;
export type MetricO = Omit<Metric, "id" | "userId" | "projectId" | "createdAt" | "updatedAt" | "hypothesesId">;