import { describe, expect, it } from "vitest";
import { getClientIp, rateLimit } from "../src/lib/rate-limit";

describe("getClientIp", () => {
  it("prefers cf-connecting-ip (Cloudflare)", () => {
    const h = new Headers({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "198.51.100.1" });
    expect(getClientIp(h)).toBe("203.0.113.9");
  });
  it("falls back to the first x-forwarded-for entry, then x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(getClientIp(new Headers({ "x-real-ip": "192.0.2.4" }))).toBe("192.0.2.4");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimit", () => {
  it("allows up to max requests per window, then blocks", () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 2, 60).allowed).toBe(true);
    expect(rateLimit(key, 2, 60).allowed).toBe(true);
    const third = rateLimit(key, 2, 60);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });
});
