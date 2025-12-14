import { CTInput } from "./modelTypes";

export interface CuInitiationRequestResult {
  result: "success" | "error",
  errorReason?: string,
  token?: string,
  expiry?: Date
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
    token: string,
    reason: "time_expired" | "failure"
}

export interface CUServerToClientEvents {
}

export interface CUClientToServerEvents {
  perform_action: (act: CuAction,
                   ack: (res: CuActionResult) => void) => void;
}