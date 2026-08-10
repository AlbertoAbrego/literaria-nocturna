import axios, { AxiosError } from "axios";
import { getApiUrl } from "@/shared/api/env";
import { ApiError, type ApiErrorBody } from "@/shared/api/errors";

export const http = axios.create({
  baseURL: getApiUrl(),
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const { status, data } = error.response;
      return Promise.reject(
        new ApiError(
          data?.message ?? "Request failed",
          data?.code ?? statusToCode(status),
          status,
          data?.details,
        ),
      );
    }

    if (error.code === "ECONNABORTED") {
      return Promise.reject(new ApiError("Request timed out", "TIMEOUT"));
    }

    return Promise.reject(new ApiError("Network error", "NETWORK_ERROR"));
  },
);

function statusToCode(status: number): string {
  if (status >= 500) {
    return "INTERNAL_ERROR";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 409) {
    return "CONFLICT";
  }
  return "VALIDATION_ERROR";
}
