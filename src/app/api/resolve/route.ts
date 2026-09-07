import { NextRequest, NextResponse } from "next/server";
import { validatePublicMediaUrl } from "@/lib/validate-url";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { ResolveResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 4096;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`resolve:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "RATE_LIMITED",
        error: `リクエストが多すぎます。${rl.retryAfterSec}秒後に再試行してください。`,
      } satisfies ResolveResponse,
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  let body: { url?: string };
  try {
    const text = await req.text();
    if (text.length > MAX_BODY) {
      return NextResponse.json(
        { ok: false, code: "BODY_TOO_LARGE", error: "リクエストが大きすぎます。" } satisfies ResolveResponse,
        { status: 413 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_JSON", error: "JSONボディが不正です。" } satisfies ResolveResponse,
      { status: 400 }
    );
  }

  const validated = validatePublicMediaUrl(body.url || "");
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, code: validated.code, error: validated.error } satisfies ResolveResponse,
      { status: 400 }
    );
  }

  const workerUrl = (process.env.WORKER_URL || "").replace(/\/$/, "");
  if (!workerUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: "WORKER_UNSET",
        error:
          "メディア抽出ワーカーが設定されていません。WORKER_URL を設定するか、docker compose で起動してください。",
      } satisfies ResolveResponse,
      { status: 503 }
    );
  }

  const timeoutMs = Number(process.env.RESOLVE_TIMEOUT_MS || 45000);
  try {
    const res = await fetch(`${workerUrl}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: validated.url.toString() }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    const data = (await res.json()) as ResolveResponse;
    if (!res.ok || !data.ok) {
      const err = !data.ok ? data : { ok: false as const, code: "WORKER_ERROR", error: "抽出に失敗しました。" };
      return NextResponse.json(err, { status: res.status >= 400 ? res.status : 502 });
    }
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const timedOut = msg.includes("Timeout") || msg.includes("aborted") || msg.includes("AbortError");
    return NextResponse.json(
      {
        ok: false,
        code: timedOut ? "TIMEOUT" : "WORKER_UNREACHABLE",
        error: timedOut
          ? "取得がタイムアウトしました。時間をおいて再度お試しください。"
          : "ワーカーに接続できません。docker compose で worker が起動しているか確認してください。",
      } satisfies ResolveResponse,
      { status: timedOut ? 504 : 503 }
    );
  }
}
