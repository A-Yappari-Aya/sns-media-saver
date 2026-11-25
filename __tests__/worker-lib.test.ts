import { describe, expect, it } from "vitest";
import { hostOk, detectPlatform, mapInfo, isAuthorized, readWorkerAuthConfig } from "../worker/src/lib.js";

describe("worker hostOk / detectPlatform", () => {
  it("allows only supported SNS hosts", () => {
    expect(hostOk("www.youtube.com")).toBe(true);
    expect(hostOk("m.tiktok.com")).toBe(true);
    expect(hostOk("evilx.com")).toBe(false);
    expect(hostOk("example.com")).toBe(false);
  });
  it("detects the platform", () => {
    expect(detectPlatform("x.com")).toBe("x");
    expect(detectPlatform("www.instagram.com")).toBe("instagram");
    expect(detectPlatform("youtu.be")).toBe("youtube");
  });
});

describe("worker mapInfo", () => {
  it("maps a single video", () => {
    const r = mapInfo(
      { url: "https://cdn.example/v.mp4", vcodec: "h264", ext: "mp4", title: "t", uploader: "u", width: 1280, height: 720 },
      "https://x.com/a/status/1"
    );
    expect(r.ok).toBe(true);
    expect(r.platform).toBe("x");
    expect(r.author).toBe("u");
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ id: "best", type: "video", ext: "mp4", width: 1280 });
  });
  it("maps carousel entries and de-duplicates URLs", () => {
    const r = mapInfo(
      {
        title: "post",
        entries: [
          { id: "1", url: "https://cdn.example/a.jpg", vcodec: "none" },
          { id: "2", url: "https://cdn.example/a.jpg", vcodec: "none" },
          { id: "3", formats: [{ url: "https://cdn.example/b.mp4", vcodec: "h264", ext: "mp4" }] },
        ],
      },
      "https://www.instagram.com/p/X/"
    );
    expect(r.items.map((i: { url: string }) => i.url)).toEqual(["https://cdn.example/a.jpg", "https://cdn.example/b.mp4"]);
    expect(r.items[0].type).toBe("image");
    expect(r.items[1].type).toBe("video");
  });
  it("falls back to the tallest format", () => {
    const r = mapInfo(
      { formats: [{ url: "https://c/360.mp4", height: 360, vcodec: "h264" }, { url: "https://c/1080.mp4", height: 1080, vcodec: "h264" }] },
      "https://www.youtube.com/watch?v=1"
    );
    expect(r.items[0].url).toBe("https://c/1080.mp4");
  });
});

describe("worker isAuthorized", () => {
  it("denies requests when no token is configured (fail closed)", () => {
    expect(isAuthorized(undefined, "")).toBe(false);
    expect(isAuthorized("Bearer anything", "")).toBe(false);
  });
  it("allows unauthenticated requests only with the explicit insecure flag", () => {
    expect(isAuthorized(undefined, "", { allowInsecure: true })).toBe(true);
  });
  it("requires the exact bearer token when configured", () => {
    expect(isAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorized("Bearer wrong!", "s3cret")).toBe(false);
    expect(isAuthorized(undefined, "s3cret")).toBe(false);
    expect(isAuthorized("Bearer s3cret", "s3cret", { allowInsecure: true })).toBe(true);
  });
});

describe("worker readWorkerAuthConfig", () => {
  it("accepts a non-empty token in any environment", () => {
    expect(readWorkerAuthConfig({ WORKER_TOKEN: "  secret  ", NODE_ENV: "production" })).toEqual({
      ok: true,
      token: "secret",
      insecure: false,
    });
  });
  it("refuses to start in production without a token, even with the insecure flag", () => {
    const r = readWorkerAuthConfig({ NODE_ENV: "production", ALLOW_INSECURE_WORKER_NO_AUTH: "true" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/WORKER_TOKEN is required/);
  });
  it("refuses to start in development without a token or the insecure flag", () => {
    const r = readWorkerAuthConfig({ NODE_ENV: "development" });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ALLOW_INSECURE_WORKER_NO_AUTH/);
  });
  it("allows tokenless local start only with ALLOW_INSECURE_WORKER_NO_AUTH=true", () => {
    expect(readWorkerAuthConfig({ NODE_ENV: "development", ALLOW_INSECURE_WORKER_NO_AUTH: "true" })).toEqual({
      ok: true,
      token: "",
      insecure: true,
    });
  });
});
