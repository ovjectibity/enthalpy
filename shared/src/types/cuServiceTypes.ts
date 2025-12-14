import { CTInput } from "./modelTypes";

export interface CuInitiationRequest {
  secret: string
}

export interface CuInitiationRequestResult {
  result: "success" | "error",
  errorReason?: string,
  token?: string,
  expiry?: Date
}

export interface CuCloseRequest {
    token: string
}

export interface CuAction {
  action: CTInput,
  token: string,
  actionId: string
}

export interface CuActionResult {
  actionId: string,
  token: string,
  result: "success" | "error",
  errorReason?: string,
  screengrab?: string
}

export interface CuExpiryNotification {
    token: string
}

export interface CUServerToClientEvents {
  instance_expired: (note: CuExpiryNotification) => void;
}

export interface CUClientToServerEvents {
  initiate_instance: (req: CuInitiationRequest, 
                      ack: (res: CuInitiationRequestResult) => void) => void;
  perform_action: (act: CuAction,
                   ack: (res: CuActionResult) => void) => void;
  close_instance: (req: CuCloseRequest) => void;
}