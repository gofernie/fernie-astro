// src/lib/sheets.ts
type Any = Record<string, unknown>;

async function fetchJson(url: string) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Fetch failed: ${r.status} ${r.statusText}`);
  return r.json();
}

function firstArray(data: unknown): any[] | null {
  if (Array.isArray(data)) return data as any[];
  if (!data || typeof data !== "object") return null;
  const obj = data as Any;
  if (Array.isArray((obj as Any).rows)) return (obj as Any).rows as any[];
  const v = Object.values(obj).find((x) => Array.isArray(x)) as any[] | undefined;
  return v ?? null;
}

function setTab(url: string, tab?: string) {
  if (!tab) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("tab", tab); // overrides existing tab=
    return u.toString();
  } catch {
    // Fallback: replace or append tab param
    if (url.match(/([?&])tab=[^&]*/i)) {
      return url.replace(/([?&])tab=[^&]*/i, `$1tab=${encodeURIComponent(tab)}`);
    }
    return url + (url.includes("?") ? "&" : "?") + "tab=" + encodeURIComponent(tab);
  }
}

/** Get rows.
 *  - If overrideUrl is provided, that URL is used (ignores PUBLIC_SHEET_JSON).
 *  - If tab is provided, it forcibly sets/overrides ?tab=<tab> on the URL.
 */
export async function getRows(tab?: string, overrideUrl?: string): Promise<any[]> {
  const base = overrideUrl || import.meta.env.PUBLIC_SHEET_JSON;
  if (!base) throw new Error("PUBLIC_SHEET_JSON missing (and no overrideUrl provided).");
  const url = setTab(base, tab);

  const data = await fetchJson(url);

  // If response is an object with a matching key array, prefer that.
  if (tab && data && typeof data === "object" && Array.isArray((data as Any)[tab])) {
    return (data as Any)[tab] as any[];
  }
  // Otherwise normalize common shapes.
  return firstArray(data) ?? [];
}

/** Convenience: fetch directly from a specific URL and normalize arrays. */
export async function getRowsFromUrl(url: string): Promise<any[]> {
  const data = await fetchJson(url);
  return firstArray(data) ?? [];
}
