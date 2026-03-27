export type HttpOptions = {
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "user-agent":
    "slov-lex-mcp/1.2.4 (+https://github.com/ESKRiPO/Slov-Lex_MCP) Mozilla/5.0",
  accept: "*/*",
};

export async function httpGetText(url: string, options: HttpOptions = {}) {
  const retries = options.retries ?? 1;
  const retryDelayMs = options.retryDelayMs ?? 250;
  const timeoutMs = options.timeoutMs ?? 15_000;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { ...DEFAULT_HEADERS, ...(options.headers ?? {}) },
        signal: controller.signal,
      });
      const body = await res.text();
      if (!res.ok) {
        const snippet = body.slice(0, 500).replace(/\s+/g, " ").trim();
        const message = `GET ${url} failed: ${res.status} ${res.statusText} :: ${snippet}`;
        const canRetry = attempt < retries && (res.status === 429 || res.status >= 500);
        if (!canRetry) throw new Error(message);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
        continue;
      }
      return body;
    } catch (error) {
      const err = error as Error;
      const isAbortError = err.name === "AbortError";
      const canRetry = attempt < retries;
      if (!canRetry) {
        if (isAbortError) {
          throw new Error(`GET ${url} timed out after ${timeoutMs}ms`);
        }
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
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
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}: ${(e as Error).message}`);
  }
}
