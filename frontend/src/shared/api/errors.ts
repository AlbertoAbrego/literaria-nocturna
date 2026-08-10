export interface ApiErrorBody {
  message: string;
  code: string;
  details?: Record<string, string>;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: Record<string, string>;

  constructor(message: string, code: string, status?: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
