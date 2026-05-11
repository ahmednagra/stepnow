// src/lib/api-errors.ts
// Shared error shape. Both serverApiClient and nextjsApiClient return { data?, error?, status }.

export interface ApiErrorBody {
  code: string;
  message: string;
  extra?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiErrorBody;
  status: number;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly extra?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, extra?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.extra = extra;
  }

  static fromResponse(body: ApiErrorBody, status: number): ApiError {
    return new ApiError(body.code, body.message, status, body.extra);
  }
}

// Default error codes
export const ERROR_CODES = {
  BACKEND_UNREACHABLE: "BACKEND_UNREACHABLE",
  TIMEOUT: "TIMEOUT",
  PARSE_ERROR: "PARSE_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  UNKNOWN: "UNKNOWN",
} as const;
