export const APP_VERSION = __APP_VERSION__ || "dev";

// Fork customization version, e.g. "v0.18.0-custom.3". Empty string means this build purely tracks upstream,
// in which case the UI hides the customization section and behaves exactly like the upstream layout.
export const CUSTOM_VERSION = typeof __CUSTOM_VERSION__ === "string" ? __CUSTOM_VERSION__ : "";

export const DOCS_URL = import.meta.env.VITE_DOC_URL || "https://docs.canvas.best";

// Official plugin registry URL: CI publishes to plugins-dist for jsDelivr delivery; an environment variable may override it for self-hosting.
export const PLUGIN_REGISTRY_URL = import.meta.env.VITE_PLUGIN_REGISTRY_URL || "https://cdn.jsdelivr.net/gh/basketikun/infinite-canvas@plugins-dist/official-plugins.json";
