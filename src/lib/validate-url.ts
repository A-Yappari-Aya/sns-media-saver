const ALLOWED_HOST_SUFFIXES = [
  "x.com",
  "twitter.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
] as const;

export type ValidateOk = { ok: true; url: URL; platform: string };
export type ValidateErr = { ok: false; code: string; error: string };
export type ValidateResult = ValidateOk | ValidateErr;

function hostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ALLOWED_HOST_SUFFIXES.some(
    (allowed) => host === allowed || host.endsWith("." + allowed)
  );
}

function detectPlatform(hostname: string): string {
  const host = hostname.toLowerCase();
  if (host.includes("instagram")) return "instagram";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("youtube") || host === "youtu.be" || host.endsWith(".youtu.be")) return "youtube";
  if (host.includes("twitter") || host === "x.com" || host.endsWith(".x.com")) return "x";
  return "unknown";
}

/**
 * 許可ホストのみ。http(s) のみ。資格情報・私有IP・データURLは拒否。
 */
export function validatePublicMediaUrl(input: string): ValidateResult {
  const raw = (input || "").trim();
  if (!raw) {
    return { ok: false, code: "EMPTY", error: "URLを入力してください。" };
  }
  if (raw.length > 2048) {
    return { ok: false, code: "TOO_LONG", error: "URLが長すぎます。" };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, code: "INVALID_URL", error: "有効なURLではありません。" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, code: "BAD_PROTOCOL", error: "http または https のURLのみ対応しています。" };
  }

  if (url.username || url.password) {
    return { ok: false, code: "CREDENTIALS", error: "認証情報付きのURLは使えません。" };
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "[::1]"
  ) {
    return { ok: false, code: "PRIVATE_HOST", error: "私有・ローカルアドレスは許可されていません。" };
  }

  if (!hostAllowed(host)) {
    return {
      ok: false,
      code: "HOST_NOT_ALLOWED",
      error: "対応サービスは X / Instagram / TikTok / YouTube の公開URLのみです。",
    };
  }

  return { ok: true, url, platform: detectPlatform(host) };
}

export const ALLOWED_HOSTS = ALLOWED_HOST_SUFFIXES;
