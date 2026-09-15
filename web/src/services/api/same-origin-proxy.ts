/** The relay answers this bare request with its own identity payload; see `api/proxy.js`, `functions/api/proxy.ts` and the Vite dev middleware. */
const SAME_ORIGIN_PROXY_ROOT = "/api/proxy";

/** Cached verdict for the page session: null means "unknown", so the next request probes again. */
let available: boolean | null = null;
let checking: Promise<boolean> | null = null;

export function sameOriginProxyStatus() {
    return available;
}

/**
 * Whether this deployment really serves the same-origin relay. Static hosting (GitHub Pages, Cloudflare Pages without
 * the functions directory, the plain nginx image) has no such endpoint and answers it with 404/405 or its own
 * `index.html`, so a POST through `/api/proxy` fails with 405 without ever reaching the provider. One cached request
 * to the relay root separates that from a provider error: the app can then skip the dead hop and say what to fix.
 */
export function checkSameOriginProxy() {
    if (available !== null) return Promise.resolve(available);
    checking ??= (async () => {
        try {
            const response = await fetch(`${SAME_ORIGIN_PROXY_ROOT}?probe=${Date.now()}`, { cache: "no-store" });
            available = response.ok && Boolean(await response.json().catch(() => null));
        } catch {
            // An unreachable origin says nothing about the relay, so leave the verdict unknown and probe again later.
        }
        return available ?? false;
    })().finally(() => {
        if (available === null) checking = null;
    });
    return checking;
}
