const CORS_HEADERS: Record<string, string> = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "*",
    "access-control-allow-headers": "*",
    "access-control-expose-headers": "*",
    "access-control-max-age": "86400",
};

const SKIP_REQUEST_HEADERS = new Set([
    "host",
    "connection",
    "content-length",
    "accept-encoding",
    "origin",
    "referer",
    "sec-fetch-dest",
    "sec-fetch-mode",
    "sec-fetch-site",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
]);

const SKIP_RESPONSE_HEADERS = new Set([
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
]);

function readTarget(request: Request, url: URL): string {
    const urlParam = url.searchParams.get("url");
    if (urlParam && /^https?:\/\//i.test(urlParam)) return urlParam;

    // Path style /api/proxy/https://...
    const pathname = url.pathname;
    const match = pathname.match(/\/api\/proxy\/(https?:\/\/.+)/);
    if (match) {
        try {
            return decodeURIComponent(match[1]);
        } catch {
            return match[1];
        }
    }
    const after = pathname.replace(/^\/api\/proxy\/?/, "");
    if (/^https?:\/\//i.test(after)) {
        try {
            return decodeURI(after);
        } catch {
            return after;
        }
    }
    return "";
}

function forwardHeaders(request: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        if (SKIP_REQUEST_HEADERS.has(key.toLowerCase())) return;
        headers[key] = value;
    });
    return headers;
}

export async function onRequest(context: { request: Request }): Promise<Response> {
    const request = context.request;
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const target = readTarget(request, url);

    if (!target) {
        if (url.pathname === "/api/proxy" || url.pathname === "/api/proxy/") {
            return new Response(JSON.stringify({ name: "infinite-canvas-cors-proxy", usage: "/api/proxy?url=<full-target-url>" }), {
                status: 200,
                headers: { ...CORS_HEADERS, "content-type": "application/json" },
            });
        }
        return new Response(JSON.stringify({ error: "Missing url param" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
    }

    if (!/^https?:\/\//i.test(target)) {
        return new Response(JSON.stringify({ error: "Invalid url" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
    }

    try {
        const hasBody = request.method !== "GET" && request.method !== "HEAD";
        const body = hasBody ? await request.arrayBuffer() : undefined;

        const upstream = await fetch(target, {
            method: request.method,
            headers: forwardHeaders(request),
            body: hasBody && body && body.byteLength ? body : undefined,
            redirect: "follow",
        });

        const responseHeaders = new Headers(CORS_HEADERS);
        upstream.headers.forEach((value, key) => {
            if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
            if (key.toLowerCase().startsWith("access-control-")) return;
            responseHeaders.set(key, value);
        });

        return new Response(upstream.body, {
            status: upstream.status,
            headers: responseHeaders,
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error: message }), {
            status: 502,
            headers: { ...CORS_HEADERS, "content-type": "application/json" },
        });
    }
}
