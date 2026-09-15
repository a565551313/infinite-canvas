import axios from "axios";

import i18n from "@/i18n";
import { checkSameOriginProxy, sameOriginProxyStatus } from "./same-origin-proxy";

/** Statuses a host answers by itself when the deployment ships no /api/proxy relay: static hosting refuses POST with 405 and replies 404 to GET. */
const MISSING_PROXY_STATUS = new Set([404, 405, 501]);

export function isSameOriginProxyUrl(url: string) {
    return url.includes("/api/proxy");
}

export function unwrapProxyUrl(url: string) {
    try {
        const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
        const target = parsed.searchParams.get("url");
        if (target) return target;
    } catch {
        // ignore
    }
    const match = url.match(/\/api\/proxy\/(https?:\/\/.+)/);
    if (match) {
        try {
            return decodeURIComponent(match[1]);
        } catch {
            return match[1];
        }
    }
    return url;
}

/** Raised when neither the site relay nor a direct cross-origin call can carry the request, so the user reads the real fix instead of a bare 405. */
export class ProxyUnavailableError extends Error {
    constructor() {
        super(i18n.t("apiErrors.proxyUnavailable"));
        this.name = "ProxyUnavailableError";
    }
}

/** The provider URL behind a relayed request, or "" when this request does not go through the relay. */
function directUrlOf(url: string) {
    if (!isSameOriginProxyUrl(url)) return "";
    const direct = unwrapProxyUrl(url);
    return direct === url ? "" : direct;
}

/** The relay always forwards the provider status and body, so these answers came from the host instead of the provider. */
function isMissingProxyResponse(status: number | undefined, contentType: string) {
    if (typeof status !== "number") return false;
    return MISSING_PROXY_STATUS.has(status) || (status < 400 && contentType.includes("text/html"));
}

/** Browser-level failure with no response at all: CORS-blocked fetch, or the axios equivalent of it. */
function isBlockedRequest(error: unknown) {
    if (axios.isAxiosError(error)) return !error.response && error.code === "ERR_NETWORK";
    return error instanceof TypeError && /fetch|network|load failed/i.test(error.message);
}

export async function fetchWithProxyFallback(input: string, init: RequestInit): Promise<Response> {
    const directUrl = directUrlOf(input);
    if (!directUrl) return fetch(input, init);
    // Once the host has proven it has no relay, stop paying for its 405 on every request.
    if (sameOriginProxyStatus() === false) return fetchWithoutRelay(directUrl, init);

    let relayed: Response | null = null;
    try {
        const response = await fetch(input, init);
        if (!isMissingProxyResponse(response.status, response.headers.get("content-type") || "")) return response;
        relayed = response;
    } catch (error) {
        // The relay never answered, so the direct call is all that is left to try.
        if (!isBlockedRequest(error)) throw error;
    }

    // A working relay only mirrors what the provider said: keep that answer, including its 404 on /v1/responses.
    if ((await checkSameOriginProxy()) && relayed) return relayed;
    return fetchWithoutRelay(directUrl, init);
}

/** Call the provider directly; when this host really has no relay, a browser-blocked request gets an actionable message. */
async function fetchWithoutRelay(url: string, init: RequestInit) {
    try {
        return await fetch(url, init);
    } catch (error) {
        if (!isBlockedRequest(error) || sameOriginProxyStatus() !== false) throw error;
        throw new ProxyUnavailableError();
    }
}

export async function axiosWithProxyFallback<T>(request: () => Promise<{ data: T; status: number; headers: unknown; config: { url?: string } }>): Promise<{ data: T }> {
    try {
        return await request();
    } catch (error) {
        if (axios.isCancel(error)) throw error;
        const config = axios.isAxiosError(error) ? error.config : undefined;
        const directUrl = config?.url ? directUrlOf(config.url) : "";
        if (!config || !directUrl) throw error;
        const relayed = axios.isAxiosError(error) ? error.response : undefined;
        const relayedType = String((relayed?.headers as Record<string, unknown> | undefined)?.["content-type"] || "");
        if (relayed && !isMissingProxyResponse(relayed.status, relayedType)) throw error;
        if ((await checkSameOriginProxy()) && relayed) throw error;
        try {
            return await axios.request({ ...config, url: directUrl });
        } catch (retryError) {
            if (sameOriginProxyStatus() === false && isBlockedRequest(retryError)) throw new ProxyUnavailableError();
            throw retryError;
        }
    }
}
