import { describe, expect, it } from "vitest";
import { validatePublicMediaUrl } from "../src/lib/validate-url";

describe("validatePublicMediaUrl", () => {
  it("accepts X / Twitter URLs", () => {
    const r = validatePublicMediaUrl("https://x.com/user/status/123");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.platform).toBe("x");

    const r2 = validatePublicMediaUrl("https://twitter.com/user/status/123");
    expect(r2.ok).toBe(true);
  });

  it("accepts Instagram / TikTok / YouTube", () => {
    expect(validatePublicMediaUrl("https://www.instagram.com/p/ABC123/").ok).toBe(true);
    expect(validatePublicMediaUrl("https://www.tiktok.com/@user/video/123").ok).toBe(true);
    expect(validatePublicMediaUrl("https://youtu.be/dQw4w9WgXcQ").ok).toBe(true);
    expect(validatePublicMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ").ok).toBe(true);
  });

  it("rejects empty / invalid / bad protocol", () => {
    expect(validatePublicMediaUrl("").ok).toBe(false);
    expect(validatePublicMediaUrl("not-a-url").ok).toBe(false);
    expect(validatePublicMediaUrl("ftp://x.com/a").ok).toBe(false);
  });

  it("rejects disallowed hosts and private addresses", () => {
    expect(validatePublicMediaUrl("https://example.com/post").ok).toBe(false);
    expect(validatePublicMediaUrl("https://localhost/x").ok).toBe(false);
    expect(validatePublicMediaUrl("https://127.0.0.1/x").ok).toBe(false);
    expect(validatePublicMediaUrl("https://192.168.1.1/x").ok).toBe(false);
  });

  it("rejects credentials in URL", () => {
    const r = validatePublicMediaUrl("https://user:pass@x.com/status/1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("CREDENTIALS");
  });
});
