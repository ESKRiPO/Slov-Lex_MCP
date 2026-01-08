export type HttpOptions = {
  headers?: Record<string, string>;
};

const DEFAULT_HEADERS: Record<string, string> = {
  "user-agent":
    "slov-lex-mcp/1.0 (+https://github.com; contact: mcp) Mozilla/5.0",
  accept: "*/*",
};

export async function httpGetText(url: string, options: HttpOptions = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers: { ...DEFAULT_HEADERS, ...(options.headers ?? {}) },
  });
  const body = await res.text();
  if (!res.ok) {
    const snippet = body.slice(0, 500).replace(/\s+/g, " ").trim();
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText} :: ${snippet}`);
  }
  return body;
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

