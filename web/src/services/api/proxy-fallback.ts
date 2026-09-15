import axios from "axios";

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

function isFetchNetworkError(error: unknown) {
    return error instanceof TypeError && /fetch|network|load failed/i.test(error.message);
}

export async function fetchWithProxyFallback(input: string, init: RequestInit): Promise<Response> {
    try {
        const response = await fetch(input, init);
        if (response.status === 404 && isSameOriginProxyUrl(input)) {
            const directUrl = unwrapProxyUrl(input);
            if (directUrl !== input) {
                return await fetch(directUrl, init);
            }
        }
        return response;
    } catch (error) {
        if (isSameOriginProxyUrl(input) && isFetchNetworkError(error)) {
            const directUrl = unwrapProxyUrl(input);
            if (directUrl !== input) {
                return await fetch(directUrl, init);
            }
        }
        throw error;
    }
}

export async function axiosWithProxyFallback<T>(request: () => Promise<{ data: T; status: number; headers: unknown; config: { url?: string } }>): Promise<{ data: T }> {
    try {
        return await request();
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404 && isSameOriginProxyUrl(error.config?.url || "")) {
            const directUrl = unwrapProxyUrl(error.config?.url || "");
            if (directUrl !== error.config?.url) {
                const originalConfig = error.config;
                if (originalConfig) {
                    return await axios.request({
                        ...originalConfig,
                        url: directUrl,
                    });
                }
            }
        }
        throw error;
    }
}
