import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 300;

function isRetriable(error: unknown): boolean {
  const axiosError = error as AxiosError;
  if (!axiosError.response) return true;
  const status = axiosError.response.status;
  return status === 429 || status >= 500;
}

function retryDelayMs(error: unknown, attempt: number): number {
  const axiosError = error as AxiosError;
  const header = axiosError.response?.headers?.["retry-after"] as string | undefined;
  if (header) {
    const seconds = Number(header);
    if (!Number.isNaN(seconds)) return seconds * 1000;
  }
  return BASE_BACKOFF_MS * 2 ** attempt;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function httpRequest<T>(config: AxiosRequestConfig): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      const response = await axios.request<T>({ timeout: DEFAULT_TIMEOUT_MS, ...config });
      return response.data;
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isRetriable(error)) throw error;
      await delay(retryDelayMs(error, attempt));
      attempt++;
    }
  }
}
