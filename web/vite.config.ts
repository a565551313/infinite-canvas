import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { parseChangelog } from "./src/lib/release";

const webDir = dirname(fileURLToPath(import.meta.url));
const localVersion = readFileSync(resolve(webDir, "../VERSION"), "utf8").trim() || "dev";
const localChangelog = readFileSync(resolve(webDir, "../CHANGELOG.md"), "utf8");

// Expose /plugins/index.json with local plugin files from public/plugins.
// The frontend can discover and list them when enabled; development reads the directory live, while builds emit a static registry.
function localPluginsManifest(): Plugin {
    const pluginsDir = resolve(webDir, "public/plugins");
    const listLocalPlugins = () => {
        try {
            return readdirSync(pluginsDir)
                .filter((file) => file.endsWith(".js"))
                .sort()
                .map((file) => `/plugins/${file}`);
        } catch {
            return [];
        }
    };
    return {
        name: "local-plugins-manifest",
        configureServer(server) {
            server.middlewares.use("/plugins/index.json", (_req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(listLocalPlugins()));
            });
        },
        generateBundle() {
            this.emitFile({ type: "asset", fileName: "plugins/index.json", source: JSON.stringify(listLocalPlugins()) });
        },
    };
}

// Dev-only same-origin CORS proxy so that withLocalProxy() -> /api/proxy works locally
// without requiring Vercel. Mirrors the logic in /api/proxy.js.
function devCorsProxy(): Plugin {
    return {
        name: "dev-cors-proxy",
        configureServer(server) {
            server.middlewares.use("/api/proxy", async (req, res) => {
                const CORS_HEADERS: Record<string, string> = {
                    "access-control-allow-origin": "*",
                    "access-control-allow-methods": "*",
                    "access-control-allow-headers": "*",
                    "access-control-expose-headers": "*",
                    "access-control-max-age": "86400",
                };
                Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
                if (req.method === "OPTIONS") {
                    res.statusCode = 204;
                    res.end();
                    return;
                }
                const reqUrl = new URL(req.url || "/", "http://localhost");
                let target = reqUrl.searchParams.get("url") || "";
                if (!target) {
                    const match = (req.url || "").match(/\/api\/proxy\/(https?:\/\/.+)/);
                    if (match) {
                        try {
                            target = decodeURIComponent(match[1]);
                        } catch {
                            target = match[1];
                        }
                    }
                }
                if (!target || !/^https?:\/\//i.test(target)) {
                    res.statusCode = 400;
                    res.setHeader("content-type", "application/json");
                    res.end(JSON.stringify({ error: "Missing url param" }));
                    return;
                }
                try {
                    const skipReq = new Set([
                        "host",
                        "connection",
                        "content-length",
                        "accept-encoding",
                        "origin",
                        "referer",
                        "sec-fetch-dest",
                        "sec-fetch-mode",
                        "sec-fetch-site",
                    ]);
                    const headers: Record<string, string> = {};
                    for (const [k, v] of Object.entries(req.headers)) {
                        if (skipReq.has(k.toLowerCase())) continue;
                        if (v === undefined) continue;
                        headers[k] = Array.isArray(v) ? v.join(", ") : (v as string);
                    }
                    const hasBody = req.method !== "GET" && req.method !== "HEAD";
                    let body: Buffer | undefined;
                    if (hasBody) {
                        body = await new Promise<Buffer>((resolve, reject) => {
                            const chunks: Buffer[] = [];
                            req.on("data", (c) => chunks.push(c as Buffer));
                            req.on("end", () => resolve(Buffer.concat(chunks)));
                            req.on("error", reject);
                        });
                    }
                    const upstream = await fetch(target, {
                        method: req.method,
                        headers,
                        body: hasBody && body && body.length ? body : undefined,
                    });
                    res.statusCode = upstream.status;
                    upstream.headers.forEach((value, key) => {
                        if (["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive"].includes(key.toLowerCase())) return;
                        if (key.toLowerCase().startsWith("access-control-")) return;
                        res.setHeader(key, value);
                    });
                    if (!upstream.body) {
                        res.end();
                        return;
                    }
                    const reader = upstream.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        res.write(value);
                    }
                    res.end();
                } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    if (!res.headersSent) {
                        res.statusCode = 502;
                        res.setHeader("content-type", "application/json");
                        res.end(JSON.stringify({ error: msg }));
                    } else {
                        try { res.end(); } catch {}
                    }
                }
            });
        },
    };
}

export default defineConfig({
    base: process.env.VITE_BASE || "/",
    plugins: [react(), localPluginsManifest(), devCorsProxy()],
    resolve: {
        alias: {
            "@": resolve(webDir, "src"),
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(localVersion),
        __APP_RELEASES__: JSON.stringify(parseChangelog(localChangelog)),
    },
});
