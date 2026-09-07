import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const workerUrl = process.env.WORKER_URL || "";
  let worker: "ok" | "down" | "unset" = "unset";
  if (workerUrl) {
    try {
      const res = await fetch(`${workerUrl.replace(/\/$/, "")}/health`, {
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      });
      worker = res.ok ? "ok" : "down";
    } catch {
      worker = "down";
    }
  }
  return NextResponse.json({ ok: true, service: "メディア保存", worker });
}
