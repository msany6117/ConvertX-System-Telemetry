/**
 * Safe fetch helper that handles non-JSON, empty, or HTML responses gracefully.
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text();

  let data: any = null;
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      // Response was not valid JSON (e.g. 404/405 HTML from proxy or static host)
    }
  }

  if (!res.ok) {
    if (res.status === 404 || res.status === 405) {
      throw new Error(
        `API endpoint returned HTTP ${res.status}. If deployed on Vercel, make sure GEMINI_API_KEY is configured in Vercel Project Settings > Environment Variables.`
      );
    }
    const message =
      data?.error ||
      data?.message ||
      (text && !text.includes('<!doctype') && text.length < 250
        ? text
        : `Server request failed (HTTP ${res.status} ${res.statusText || ''})`);
    throw new Error(message);
  }

  if (data === null || data === undefined) {
    throw new Error('Received an empty response from server.');
  }

  return data as T;
}
