/**
 * Same-origin CORS relay for Vercel deployments whose Root Directory is the repository root.
 * If the project is rooted at `web/`, Vercel cannot see this file, so `web/api/proxy.js` carries the same code.
 */
const CORS_HEADERS = {
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

function readTarget(req) {
    // Try query param ?url=
    const urlFromQuery = req.query?.url || (req.url && new URL(req.url, "http://localhost").searchParams.get("url"));
    if (urlFromQuery && /^https?:\/\//i.test(urlFromQuery)) {
        return urlFromQuery;
    }
    // Try path /api/proxy/https://...
    const rawUrl = req.url || "";
    // Extract after /api/proxy/
    const match = rawUrl.match(/\/api\/proxy\/(https?:\/\/.+)/);
    if (match) {
        try {
            return decodeURIComponent(match[1]);
        } catch {
            return match[1];
        }
    }
    // Try /api/proxy?url encoded in path without query parsing
    const afterProxy = rawUrl.replace(/^\/api\/proxy\/?/, "").split("?")[0];
    if (/^https?:\/\//i.test(afterProxy)) {
        try {
            return decodeURI(afterProxy);
        } catch {
            return afterProxy;
        }
    }
    // Also support local proxy style: /https://...
    const localProxyMatch = rawUrl.match(/^\/(https?:\/\/.+)/);
    if (localProxyMatch) {
        try {
            return decodeURI(localProxyMatch[1]);
        } catch {
            return localProxyMatch[1];
        }
    }
    return "";
}

function forwardHeaders(req) {
    const headers = {};
    for (const [key, value] of Object.entries(req.headers || {})) {
        if (SKIP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
        if (value === undefined) continue;
        headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }
    return headers;
}

function responseHeaders(upstream) {
    const headers = { ...CORS_HEADERS };
    upstream.headers.forEach((value, key) => {
        if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
        if (key.toLowerCase().startsWith("access-control-")) return;
        headers[key] = value;
    });
    return headers;
}

function sendJson(res, status, payload) {
    res.writeHead(status, { ...CORS_HEADERS, "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(payload));
}

async function getRawBody(req) {
    // Vercel may have already parsed body, but we try to read raw
    if (req.body !== undefined) {
        if (typeof req.body === "string") return req.body;
        if (Buffer.isBuffer(req.body)) return req.body;
        // If body is object (JSON parsed), re-stringify
        if (typeof req.body === "object") {
            // If it's already parsed, check if we have rawBody
            if (req.rawBody) return req.rawBody;
            return JSON.stringify(req.body);
        }
    }
    // Fallback: read stream
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    const target = readTarget(req);

    if (!target) {
        // Root of proxy - show info
        if ((req.url || "/").replace(/\?.*$/, "") === "/api/proxy" || req.url === "/api/proxy/") {
            sendJson(res, 200, {
                name: "infinite-canvas-cors-proxy",
                usage: "/api/proxy?url=<full-target-url>",
                example: "/api/proxy?url=https://api.openai.com/v1/models",
            });
            return;
        }
        sendJson(res, 400, { error: "Missing target url. Use ?url=https://..." });
        return;
    }

    if (!/^https?:\/\//i.test(target)) {
        sendJson(res, 400, { error: "Invalid target url" });
        return;
    }

    try {
        const hasBody = req.method !== "GET" && req.method !== "HEAD";
        const body = hasBody ? await getRawBody(req) : undefined;

        const upstream = await fetch(target, {
            method: req.method,
            headers: forwardHeaders(req),
            body: hasBody && body && body.length !== 0 ? body : undefined,
            redirect: "follow",
        });

        res.writeHead(upstream.status, responseHeaders(upstream));

        if (!upstream.body) {
            res.end();
            return;
        }

        // Stream response (important for SSE)
        const reader = upstream.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
        } catch (e) {
            // If client disconnected, just end
            try { res.end(); } catch {}
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!res.headersSent) {
            sendJson(res, 502, { error: message });
        } else {
            try { res.end(); } catch {}
        }
    }
}
