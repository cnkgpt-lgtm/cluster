import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("rate limiter login", () => {
  it("mengizinkan hingga batas dalam satu jendela", () => {
    const key = `test-${Date.now()}-a`;
    for (let i = 0; i < 10; i++) expect(checkRateLimit(key, 10, 60_000)).toBe(true);
    expect(checkRateLimit(key, 10, 60_000)).toBe(false);
  });

  it("key berbeda punya bucket sendiri", () => {
    const a = `test-${Date.now()}-b1`;
    const b = `test-${Date.now()}-b2`;
    for (let i = 0; i < 10; i++) checkRateLimit(a, 10, 60_000);
    expect(checkRateLimit(a, 10, 60_000)).toBe(false);
    expect(checkRateLimit(b, 10, 60_000)).toBe(true);
  });
});
