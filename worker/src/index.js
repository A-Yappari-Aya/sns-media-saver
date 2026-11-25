#!/usr/bin/env node
import http from "node:http";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { hostOk, mapInfo, isAuthorized, readWorkerAuthConfig } from "./lib.js";

export function createWorkerServer({
  token = "",
  allowInsecure = false,
  ytDlp = process.env.YT_DLP_PATH || "yt-dlp",
  timeoutMs = Number(process.env.WORKER_TIMEOUT_MS || 40000),
  maxFilesize = process.env.MAX_FILESIZE || "100M",
} = {}) {
  function readJson(req, limit = 4096) {
    return new Promise((resolveRead, reject) => {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
        if (raw.length > limit) {
          reject(Object.assign(new Error("body too large"), { code: 413 }));
          req.destroy();
        }
      });
      req.on("end", () => {
        try { resolveRead(raw ? JSON.parse(raw) : {}); }
        catch { reject(Object.assign(new Error("bad json"), { code: 400 })); }
      });
      req.on("error", reject);
    });
  }

  function runYtDlp(url) {
    return new Promise((resolveRun, reject) => {
      const args = ["--dump-single-json","--no-playlist","--no-warnings","--skip-download","--no-check-certificates","-f","bv*+ba/b","--max-filesize",maxFilesize,url];
      const child = spawn(ytDlp, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => { child.kill("SIGKILL"); reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })); }, timeoutMs);
      child.stdout.on("data", (d) => { stdout += d; if (stdout.length > 8000000) { child.kill("SIGKILL"); reject(Object.assign(new Error("output too large"), { code: "TOO_LARGE" })); } });
      child.stderr.on("data", (d) => { stderr += d; });
      child.on("error", (err) => { clearTimeout(timer); reject(err); });
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code !== 0) { const err = new Error(stderr.slice(0, 500) || ("yt-dlp exit " + code)); err.code = "YTDLP_FAIL"; reject(err); return; }
        try { resolveRun(JSON.parse(stdout)); } catch { reject(Object.assign(new Error("invalid yt-dlp json"), { code: "PARSE" })); }
      });
    });
  }

  function send(res, status, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
    res.end(body);
  }

  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { ok: true, service: "worker" });
    }
    if (req.method === "POST" && req.url === "/resolve") {
      if (!isAuthorized(req.headers.authorization, token, { allowInsecure })) {
        return send(res, 401, { ok: false, code: "UNAUTHORIZED", error: "unauthorized" });
      }
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
}

export function startWorkerFromEnv(env = process.env) {
  const auth = readWorkerAuthConfig(env);
  if (!auth.ok) {
    const err = new Error(auth.error);
    err.code = "WORKER_AUTH_CONFIG";
    return Promise.reject(err);
  }
  if (auth.insecure) {
    console.warn("[worker] ALLOW_INSECURE_WORKER_NO_AUTH=true: /resolve has no auth (local only)");
  }
  const port = Number(env.PORT || 4100);
  const server = createWorkerServer({
    token: auth.token,
    allowInsecure: auth.insecure,
    ytDlp: env.YT_DLP_PATH || "yt-dlp",
    timeoutMs: Number(env.WORKER_TIMEOUT_MS || 40000),
    maxFilesize: env.MAX_FILESIZE || "100M",
  });
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, "0.0.0.0", () => {
      const addr = server.address();
      console.log("[worker] listening on :" + addr.port + " yt-dlp=" + (env.YT_DLP_PATH || "yt-dlp"));
      resolveListen(server);
    });
  });
}

function isMain() {
  const entry = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href;
  return entry === import.meta.url;
}

if (isMain()) {
  startWorkerFromEnv(process.env).catch((err) => {
    console.error("[worker] " + err.message);
    process.exit(1);
  });
}
