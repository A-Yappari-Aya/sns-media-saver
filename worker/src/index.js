#!/usr/bin/env node
import http from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 4100);
const YT_DLP = process.env.YT_DLP_PATH || "yt-dlp";
const TIMEOUT_MS = Number(process.env.WORKER_TIMEOUT_MS || 40000);
const MAX_FILESIZE = process.env.MAX_FILESIZE || "100M";

const ALLOWED = ["x.com","twitter.com","instagram.com","tiktok.com","youtube.com","youtu.be"];

function hostOk(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED.some((a) => host === a || host.endsWith("." + a));
}

function detectPlatform(hostname) {
  const h = hostname.toLowerCase();
  if (h.includes("instagram")) return "instagram";
  if (h.includes("tiktok")) return "tiktok";
  if (h.includes("youtube") || h.includes("youtu.be")) return "youtube";
  if (h.includes("twitter") || h === "x.com" || h.endsWith(".x.com")) return "x";
  return "unknown";
}

function readJson(req, limit = 4096) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > limit) {
        reject(Object.assign(new Error("body too large"), { code: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(Object.assign(new Error("bad json"), { code: 400 })); }
    });
    req.on("error", reject);
  });
}

function runYtDlp(url) {
  return new Promise((resolve, reject) => {
    const args = ["--dump-single-json","--no-playlist","--no-warnings","--skip-download","--no-check-certificates","-f","bv*+ba/b","--max-filesize",MAX_FILESIZE,url];
    const child = spawn(YT_DLP, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })); }, TIMEOUT_MS);
    child.stdout.on("data", (d) => { stdout += d; if (stdout.length > 8000000) { child.kill("SIGKILL"); reject(Object.assign(new Error("output too large"), { code: "TOO_LARGE" })); } });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", (err) => { clearTimeout(timer); reject(err); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) { const err = new Error(stderr.slice(0, 500) || ("yt-dlp exit " + code)); err.code = "YTDLP_FAIL"; reject(err); return; }
      try { resolve(JSON.parse(stdout)); } catch { reject(Object.assign(new Error("invalid yt-dlp json"), { code: "PARSE" })); }
    });
  });
}

function pickExt(format, url) {
  if (format && format.ext) return format.ext;
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.([a-z0-9]{2,5})$/i);
    if (m) return m[1].toLowerCase();
  } catch {}
  return undefined;
}

function mapInfo(info, sourceUrl) {
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

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true, service: "worker" });
  }
  if (req.method === "POST" && req.url === "/resolve") {
    try {
      const body = await readJson(req);
      const raw = (body.url || "").trim();
      let url;
      try { url = new URL(raw); } catch { return send(res, 400, { ok: false, code: "INVALID_URL", error: "有効なURLではありません。" }); }
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return send(res, 400, { ok: false, code: "BAD_PROTOCOL", error: "http(s) のみ対応です。" });
      }
      if (!hostOk(url.hostname)) {
        return send(res, 400, { ok: false, code: "HOST_NOT_ALLOWED", error: "許可されていないホストです。" });
      }
      const info = await runYtDlp(url.toString());
      const mapped = mapInfo(info, url.toString());
      if (!mapped.items.length) {
        return send(res, 404, { ok: false, code: "NO_MEDIA", error: "ダウンロード可能なメディアが見つかりませんでした。非公開・地域制限・削除の可能性があります。" });
      }
      return send(res, 200, mapped);
    } catch (e) {
      const code = e.code || "WORKER_ERROR";
      const status = code === "TIMEOUT" ? 504 : code === 413 ? 413 : code === 400 ? 400 : 502;
      const messages = { TIMEOUT: "取得がタイムアウトしました。", YTDLP_FAIL: "メディア情報の取得に失敗しました。公開URLか、サービス側の制限をご確認ください。", TOO_LARGE: "応答が大きすぎます。" };
      return send(res, status, { ok: false, code: String(code), error: messages[code] || e.message || "ワーカーエラー" });
    }
  }
  send(res, 404, { ok: false, code: "NOT_FOUND", error: "not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("[worker] listening on :" + PORT + " yt-dlp=" + YT_DLP);
});
