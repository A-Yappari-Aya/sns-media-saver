import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default OpenNext config for Cloudflare Workers.
// No incremental cache is configured: every page here is either static or force-dynamic.
export default defineCloudflareConfig();
