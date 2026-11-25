import { randomUUID, timingSafeEqual } from "node:crypto";

export const ALLOWED = ["x.com","twitter.com","instagram.com","tiktok.com","youtube.com","youtu.be"];

export function hostOk(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED.some((a) => host === a || host.endsWith("." + a));
}

export function detectPlatform(hostname) {
  const h = hostname.toLowerCase();
  if (h.includes("instagram")) return "instagram";
  if (h.includes("tiktok")) return "tiktok";
  if (h.includes("youtube") || h.includes("youtu.be")) return "youtube";
  if (h.includes("twitter") || h === "x.com" || h.endsWith(".x.com")) return "x";
  return "unknown";
}

export function pickExt(format, url) {
  if (format && format.ext) return format.ext;
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-z0-9]{2,5})$/i);
    if (m) return m[1].toLowerCase();
  } catch {}
  return undefined;
}

export function mapInfo(info, sourceUrl) {
  const items = [];
  const thumb = info.thumbnail || (Array.isArray(info.thumbnails) && info.thumbnails.length ? info.thumbnails[info.thumbnails.length - 1].url : undefined);
  const push = (partial) => {
    if (!partial.url) return;
    items.push({ id: partial.id || randomUUID(), type: partial.type || "unknown", url: partial.url, downloadUrl: partial.url, thumbnail: partial.thumbnail || thumb, title: info.title, width: partial.width, height: partial.height, duration: partial.duration ?? info.duration, ext: partial.ext, filesize: partial.filesize, format: partial.format });
  };
  if (info.url) {
    const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(info.url);
    const type = isImage ? "image" : (info.vcodec && info.vcodec !== "none" ? "video" : (info.acodec && info.acodec !== "none" ? "audio" : "video"));
    push({ id: "best", type, url: info.url, width: info.width, height: info.height, duration: info.duration, ext: pickExt(info, info.url), filesize: info.filesize || info.filesize_approx, format: info.format, thumbnail: thumb });
  }
  if (Array.isArray(info.entries)) {
    for (const entry of info.entries) {
      if (!entry) continue;
      let u = entry.url;
      if (!u && entry.formats && entry.formats.length) {
        const f = entry.formats.filter((x) => x.url).at(-1);
        if (f) { push({ id: entry.id || randomUUID(), type: f.vcodec && f.vcodec !== "none" ? "video" : "image", url: f.url, width: f.width || entry.width, height: f.height || entry.height, duration: entry.duration, ext: pickExt(f, f.url), filesize: f.filesize || f.filesize_approx, format: f.format, thumbnail: entry.thumbnail || thumb }); }
      } else if (u) {
        push({ id: entry.id || randomUUID(), type: entry.vcodec && entry.vcodec !== "none" ? "video" : "image", url: u, width: entry.width, height: entry.height, duration: entry.duration, ext: pickExt(entry, u), filesize: entry.filesize || entry.filesize_approx, thumbnail: entry.thumbnail || thumb });
      }
    }
  }
  if (!items.length && Array.isArray(info.formats)) {
    const preferred = info.formats.filter((f) => f.url).sort((a, b) => (b.height || 0) - (a.height || 0));
    const top = preferred[0];
    if (top) {
      const type = top.vcodec && top.vcodec !== "none" ? "video" : (top.acodec && top.acodec !== "none" ? "audio" : "image");
      push({ id: top.format_id || "fmt", type, url: top.url, width: top.width, height: top.height, duration: info.duration, ext: pickExt(top, top.url), filesize: top.filesize || top.filesize_approx, format: top.format, thumbnail: thumb });
    }
  }
  const seen = new Set();
  const unique = items.filter((it) => { if (seen.has(it.url)) return false; seen.add(it.url); return true; });
  return { ok: true, platform: detectPlatform(new URL(sourceUrl).hostname), title: info.title, author: info.uploader || info.channel || info.creator, sourceUrl, items: unique.slice(0, 30) };
}

/**
 * Decide whether the worker may start without a shared secret.
 * Production always requires WORKER_TOKEN. Elsewhere a token is still
 * required unless ALLOW_INSECURE_WORKER_NO_AUTH=true (loopback dev only).
 */
export function readWorkerAuthConfig(env = process.env) {
  const token = String(env.WORKER_TOKEN || "").trim();
  const allowInsecure = env.ALLOW_INSECURE_WORKER_NO_AUTH === "true";
  const isProd = env.NODE_ENV === "production";
  if (token) {
    return { ok: true, token, insecure: false };
  }
  if (isProd) {
    return {
      ok: false,
      token: "",
      insecure: false,
      error: "WORKER_TOKEN is required when NODE_ENV=production. Refusing to start an unauthenticated worker.",
    };
  }
  if (!allowInsecure) {
    return {
      ok: false,
      token: "",
      insecure: false,
      error: "WORKER_TOKEN is required. For local loopback only, set ALLOW_INSECURE_WORKER_NO_AUTH=true.",
    };
  }
  return { ok: true, token: "", insecure: true };
}

/**
 * Shared-secret auth between the web app and this worker.
 * An empty token is denied unless allowInsecure is set (dev opt-out only).
 */
export function isAuthorized(authHeader, token, { allowInsecure = false } = {}) {
  if (!token) return allowInsecure === true;
  const expected = Buffer.from("Bearer " + token);
  const got = Buffer.from(String(authHeader || ""));
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}
