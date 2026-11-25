import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/resolve/route";

function req(body: unknown, ip = `198.51.100.${Math.floor(Math.random() * 250)}`) {
  return new NextRequest("http://localhost/api/resolve", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
  });
}

describe("POST /api/resolve", () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.WORKER_URL = "https://worker.example";
    process.env.WORKER_TOKEN = "tok";
  });
  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it("rejects bad JSON and disallowed hosts without calling the worker", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(req("{nope"))).status).toBe(400);
    const r = await POST(req({ url: "https://example.com/a" }));
    expect(r.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 when WORKER_URL is unset", async () => {
    delete process.env.WORKER_URL;
    const r = await POST(req({ url: "https://x.com/a/status/1" }));
    expect(r.status).toBe(503);
    expect((await r.json()).code).toBe("WORKER_UNSET");
  });

  it("forwards to the worker with the bearer token and returns its result", async () => {
    const payload = { ok: true, platform: "x", sourceUrl: "https://x.com/a/status/1", items: [] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await POST(req({ url: "https://x.com/a/status/1" }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual(payload);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://worker.example/resolve");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("maps worker network failures to 503", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const r = await POST(req({ url: "https://x.com/a/status/1" }));
    expect(r.status).toBe(503);
    expect((await r.json()).code).toBe("WORKER_UNREACHABLE");
  });

  it("rate-limits per client IP", async () => {
    process.env.RATE_LIMIT_MAX = "1";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, items: [] }))));
    const ip = "192.0.2.200";
    await POST(req({ url: "https://x.com/a/status/1" }, ip));
    const r = await POST(req({ url: "https://x.com/a/status/1" }, ip));
    expect(r.status).toBe(429);
  });
});
