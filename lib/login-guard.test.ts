// Run: node --test lib/login-guard.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, LoginLimiter, safeNext } from "./login-guard.ts";

test("safeNext keeps same-site paths", () => {
  assert.equal(safeNext("/"), "/");
  assert.equal(safeNext("/yo"), "/yo");
  assert.equal(safeNext("/learn/a1-u03-l06-a?x=1#top"), "/learn/a1-u03-l06-a?x=1#top");
  assert.equal(safeNext("/unit/a2-u05/../../yo"), "/yo"); // dot segments resolve on this site
});

test("safeNext refuses anything that could leave the site", () => {
  for (const bad of [
    "https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "/\t/evil.com", "/\n/evil.com",
    "javascript:alert(1)", "evil.com", "", null, undefined, 42, "/" + "a".repeat(2001), "/login", "/login?next=/yo",
  ]) assert.equal(safeNext(bad), "/", String(bad));
  assert.equal(safeNext("/%5Cevil.com"), "/%5Cevil.com"); // encoded: a path on this site, not a host
});

test("clientIp takes the right-most forwarded entry (the one the proxy added)", () => {
  assert.equal(clientIp("203.0.113.7"), "203.0.113.7");
  assert.equal(clientIp("1.1.1.1, 203.0.113.7"), "203.0.113.7"); // a forged left-most entry is ignored
  assert.equal(clientIp("2001:db8::1"), "2001:db8::1");
  assert.equal(clientIp(null), "unknown");
  assert.equal(clientIp("<script>"), "unknown");
});

test("LoginLimiter blocks an IP after 5 failures and forgets after the window", () => {
  const l = new LoginLimiter({ windowMs: 1000, perIp: 5, global: 30, maxKeys: 100 });
  for (let i = 0; i < 4; i++) l.fail("a", i);
  assert.equal(l.retryAfter("a", 10), 0);
  l.fail("a", 4);
  assert.ok(l.retryAfter("a", 10) > 0);
  assert.equal(l.retryAfter("b", 10), 0); // other IPs unaffected
  assert.equal(l.retryAfter("a", 1001), 0); // window passed
});

test("LoginLimiter: a success clears that IP", () => {
  const l = new LoginLimiter({ windowMs: 1000, perIp: 3, global: 30, maxKeys: 100 });
  l.fail("a", 0); l.fail("a", 1);
  l.succeed("a");
  l.fail("a", 2); l.fail("a", 3);
  assert.equal(l.retryAfter("a", 4), 0);
});

test("LoginLimiter pauses everyone after too many failures overall (spread or spoofed IPs)", () => {
  const l = new LoginLimiter({ windowMs: 1000, perIp: 5, global: 10, maxKeys: 100 });
  for (let i = 0; i < 10; i++) l.fail(`ip${i}`, i);
  assert.ok(l.retryAfter("fresh", 20) > 0);
  assert.equal(l.retryAfter("fresh", 1100), 0);
});

test("LoginLimiter keeps memory bounded", () => {
  const l = new LoginLimiter({ windowMs: 1000, perIp: 5, global: 1000, maxKeys: 50 });
  for (let i = 0; i < 500; i++) l.fail(`ip${i}`, i);
  assert.ok((l as unknown as { ips: Map<string, number[]> }).ips.size <= 50);
});
