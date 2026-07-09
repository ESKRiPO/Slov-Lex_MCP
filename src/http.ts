import { PACKAGE_VERSION } from "./version.js";

export type HttpOptions = {
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (delayMs: number) => Promise<void>;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "user-agent":
    `slov-lex-mcp/${PACKAGE_VERSION} (+https://github.com/ESKRiPO/Slov-Lex_MCP) Mozilla/5.0`,
  accept: "*/*",
};

class HttpStatusError extends Error {}

function defaultSleep(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function retryDelay(response: Response, fallbackMs: number) {
  const retryAfter = response.headers.get("retry-after")?.trim();
  if (!retryAfter) return fallbackMs;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, 30_000);
  }

  const retryAt = Date.parse(retryAfter);
  if (Number.isFinite(retryAt)) {
    return Math.min(Math.max(retryAt - Date.now(), 0), 30_000);
  }
  return fallbackMs;
}

export async function httpGetText(url: string, options: HttpOptions = {}) {
  const retries = Math.max(0, Math.floor(options.retries ?? 1));
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
  const timeoutMs = Math.max(1, options.timeoutMs ?? 15_000);
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { ...DEFAULT_HEADERS, ...(options.headers ?? {}) },
        signal: controller.signal,
      });
      const body = await response.text();
      clearTimeout(timeout);

      if (!response.ok) {
        const snippet = body.slice(0, 500).replace(/\s+/g, " ").trim();
        const details = snippet ? ` :: ${snippet}` : "";
        const message =
          `GET ${url} failed: ${response.status} ${response.statusText}${details}`;
        const canRetry =
          attempt < retries && (response.status === 429 || response.status >= 500);

        if (!canRetry) throw new HttpStatusError(message);
        const fallbackDelay = Math.min(retryDelayMs * 2 ** attempt, 5_000);
        await sleep(retryDelay(response, fallbackDelay));
        continue;
      }

      return body;
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof HttpStatusError) throw error;

      const err = error as Error;
      const isAbortError = err.name === "AbortError";
      if (attempt >= retries) {
        if (isAbortError) {
          throw new Error(`GET ${url} timed out after ${timeoutMs}ms`, { cause: err });
        }
        throw err;
      }

      const delay = Math.min(retryDelayMs * 2 ** attempt, 5_000);
      await sleep(delay);
    }
  }

  throw new Error(`GET ${url} failed after retries`);
}

export async function httpGetJson<T>(url: string, options: HttpOptions = {}) {
  const text = await httpGetText(url, {
    ...options,
    headers: { accept: "application/json", ...(options.headers ?? {}) },
  });
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${(error as Error).message}`, {
      cause: error,
    });
  }
}
