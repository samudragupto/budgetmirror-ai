import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const nextBin = join(root, "node_modules/next/dist/bin/next");
const disabledEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "dummy-anon-key-for-tests",
  SUPABASE_SERVICE_ROLE_KEY: "dummy-service-role-key-for-tests",
  GEMINI_API_KEY: "dummy-gemini-key-for-tests",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_TELEMETRY_DISABLED: "1",
  CI: "1",
};

function testEnv(overrides = {}) {
  // Override any inherited deployment/local credentials with non-secret fixtures.
  return { ...process.env, ...disabledEnv, ...overrides };
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function runProcess(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => { output = (output + chunk.toString()).slice(-14000); });
    }
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Build exited ${code}:\n${output}`));
    });
  });
}

async function startNext(command, env) {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextBin, command, "-p", String(port), "-H", "127.0.0.1"], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => { output = (output + chunk.toString()).slice(-14000); });
  }
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      await fetch(`${base}/favicon.ico`, { signal: AbortSignal.timeout(1500) });
      return { base, child, log: () => output };
    } catch {
      await delay(250);
    }
  }
  await stopNext({ child });
  throw new Error(`${command} did not start:\n${output}`);
}

async function stopNext(app) {
  if (!app) return;
  try { process.kill(-app.child.pid, "SIGTERM"); } catch { /* already stopped */ }
  await Promise.race([
    new Promise((resolve) => app.child.once("exit", resolve)),
    delay(5000),
  ]);
  try { process.kill(-app.child.pid, "SIGKILL"); } catch { /* already stopped */ }
}

async function request(base, path, init = {}) {
  return fetch(`${base}${path}`, { redirect: "manual", signal: AbortSignal.timeout(120000), ...init });
}

function expectNoRedirect(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get("location"), null);
}

function expectLocalRedirect(response, base, path) {
  assert.equal(response.status, 307);
  const location = response.headers.get("location");
  assert.ok(location, "redirect includes Location");
  const target = new URL(location, base);
  const origin = new URL(base);
  // Next dev/start canonicalizes 127.0.0.1 to localhost when bound to loopback.
  const loopbackAlias = origin.hostname === "127.0.0.1" && target.hostname === "localhost";
  if (loopbackAlias) {
    assert.equal(target.port, origin.port);
    assert.equal(target.protocol, origin.protocol);
  } else {
    assert.equal(target.origin, origin.origin, "redirect stays on this site");
  }
  assert.equal(target.pathname, path);
  assert.equal(target.search, "");
}

async function expectHtml(response, text) {
  assert.ok((await response.text()).includes(text), `Expected HTML to contain: ${text}`);
}

const adminMutations = [
  ["POST", "/api/upload-budget"],
  ["PUT", "/api/upload-budget"],
  ["POST", "/api/recalculate-metrics"],
  ["POST", "/api/generate-recommendation"],
  ["PATCH", "/api/projects/test-id/status"],
  ["PATCH", "/api/reports"],
];

// The real Next production build/routing is exercised without a Supabase service.
describe("production without usable Supabase configuration", { concurrency: false }, () => {
  let app;
  before(async () => {
    await runProcess([nextBin, "build"], testEnv({ NODE_ENV: "production" }));
    app = await startNext("start", testEnv({ NODE_ENV: "production" }));
  });
  after(async () => stopNext(app));

  it("does not prerender protected workspace content into a public artifact", () => {
    const { routes } = JSON.parse(readFileSync(join(root, ".next/prerender-manifest.json"), "utf8"));
    for (const path of ["/admin/budget-upload", "/admin/budgets", "/admin/dashboard", "/admin/impact", "/admin/projects", "/admin/recommendations", "/admin/reports"]) {
      assert.ok(!(path in routes), `${path} must not be statically prerendered`);
    }
  });

  it("renders the login page without redirecting to itself", async () => {
    const res = await request(app.base, "/admin/login");
    expectNoRedirect(res, 200);
    const html = await res.text();
    assert.ok(html.includes("Admin sign-in is unavailable"));
    assert.ok(!html.includes("Enter demo workspace"));
    const asset = html.match(/href="(\/_next\/static\/css\/[^\"]+\.css)"/);
    assert.ok(asset, "production HTML links a Next.js static asset");
    expectNoRedirect(await request(app.base, asset[1]), 200);
  });

  it("redirects a signed-out dashboard request only once, to a renderable login", async () => {
    const res = await request(app.base, "/admin/dashboard");
    expectLocalRedirect(res, app.base, "/admin/login");
    expectNoRedirect(await request(app.base, "/admin/login"), 200);
    const other = await request(app.base, "/admin/budget-upload");
    expectLocalRedirect(other, app.base, "/admin/login");
  });

  it("does not grant access based on a cookie or missing settings", async () => {
    const headers = { cookie: "sb-example-auth-token=unverified-user-metadata-admin" };
    const page = await request(app.base, "/admin/dashboard", { headers });
    expectLocalRedirect(page, app.base, "/admin/login");
    const api = await request(app.base, "/api/recalculate-metrics", { method: "POST", headers });
    expectNoRedirect(api, 401);
  });

  it("rejects each signed-out official endpoint before parsing a body", async (t) => {
    for (const [method, path] of adminMutations) {
      await t.test(`${method} ${path}`, async () => {
        const res = await request(app.base, path, { method });
        expectNoRedirect(res, 401);
        assert.match((await res.json()).error, /Sign in required/);
      });
    }
  });

  it("keeps public pages, static files, report submission and validation public", async (t) => {
    for (const path of ["/", "/report", "/transparency", "/projects", "/sample-budget.csv"]) {
      await t.test(`GET ${path}`, async () => {
        expectNoRedirect(await request(app.base, path), 200);
      });
    }
    const invalid = await request(app.base, "/api/analyze-report", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "short", wardId: "ward-5" }),
    });
    expectNoRedirect(invalid, 400);
    const valid = await request(app.base, "/api/analyze-report", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "There has been no water for three days.", wardId: "ward-5" }),
    });
    expectNoRedirect(valid, 200);
    const citizenValidation = await request(app.base, "/api/projects/test-id/validate", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{}",
    });
    expectNoRedirect(citizenValidation, 400);
  });
});

function makeUser(id, metadata = {}) {
  return {
    id,
    email: `${id}@test.invalid`,
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: metadata,
  };
}

const users = {
  "admin-token": { user: makeUser("admin-user", { role: "citizen" }), role: "admin" },
  "policy-token": { user: makeUser("policy-user"), role: "policymaker" },
  "citizen-token": { user: makeUser("citizen-user", { role: "admin" }), role: "citizen" },
  "no-profile-token": { user: makeUser("no-profile-user", { role: "admin" }), role: null },
};

async function mockSupabase() {
  const requests = { refresh: 0, profiles: 0, user: 0 };
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    const reply = (status, value) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(value));
    };
    if (path === "/auth/v1/token") {
      requests.refresh++;
      return reply(200, {
        access_token: "admin-token", refresh_token: "refreshed-token", token_type: "bearer",
        expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: users["admin-token"].user,
      });
    }
    const token = (req.headers.authorization ?? "").replace(/^Bearer /i, "");
    if (path === "/auth/v1/user") {
      requests.user++;
      return users[token]
        ? reply(200, users[token].user)
        : reply(401, { code: "bad_jwt", msg: "Unverified token" });
    }
    if (path === "/rest/v1/profiles") {
      requests.profiles++;
      const role = users[token]?.role;
      return role
        ? reply(200, { role })
        : reply(406, { code: "PGRST116", message: "Profile missing" });
    }
    if (path.startsWith("/rest/v1/") && req.method === "GET") return reply(200, []);
    return reply(404, { message: "Not in the Supabase test fixture" });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, requests, close: () => new Promise((resolve) => server.close(resolve)) };
}

function sessionCookie(token, { expired = false } = {}) {
  const session = {
    access_token: token,
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_at: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600),
    expires_in: 3600,
    user: users[token]?.user ?? makeUser("unverified-user", { role: "admin" }),
  };
  return `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
}

// Live HTTP tests against the same Next route handlers/layout, with a local fake
// Supabase Auth + PostgREST server. No production credentials or browser-role stubs.
describe("configured Supabase with mocked Auth and profiles", { concurrency: false }, () => {
  let app;
  let supabase;
  before(async () => {
    supabase = await mockSupabase();
    app = await startNext("dev", testEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: supabase.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-public-key-not-a-secret",
    }));
  });
  after(async () => {
    await stopNext(app);
    if (supabase) await supabase.close();
  });

  it("lets signed-out visitors see login; protects the dashboard with one 307", async () => {
    const login = await request(app.base, "/admin/login");
    expectNoRedirect(login, 200);
    await expectHtml(login, "Official sign in");
    const dashboard = await request(app.base, "/admin/dashboard");
    expectLocalRedirect(dashboard, app.base, "/admin/login");
    expectNoRedirect(await request(app.base, "/admin/login"), 200);
  });

  it("never trusts a present but unverified session cookie", async () => {
    const res = await request(app.base, "/admin/dashboard", { headers: { cookie: sessionCookie("invalid-token") } });
    expectLocalRedirect(res, app.base, "/admin/login");
  });

  it("shows an access-denied page for a signed-in citizen, not a login/dashboard bounce", async () => {
    const headers = { cookie: sessionCookie("citizen-token") };
    const dashboard = await request(app.base, "/admin/dashboard", { headers });
    expectLocalRedirect(dashboard, app.base, "/admin/access-denied");
    assert.ok(!(await dashboard.text()).includes("District mirror"), "no dashboard content is sent to a citizen");
    const rsc = await request(app.base, "/admin/dashboard", { headers: { ...headers, RSC: "1" } });
    expectLocalRedirect(rsc, app.base, "/admin/access-denied");
    assert.ok(!(await rsc.text()).includes("District mirror"), "RSC responses cannot leak dashboard content");
    const deniedPage = await request(app.base, "/admin/access-denied", { headers });
    expectNoRedirect(deniedPage, 200);
    await expectHtml(deniedPage, "Access denied");
    const login = await request(app.base, "/admin/login", { headers });
    expectNoRedirect(login, 200);
    await expectHtml(login, "That account isn");
  });

  it("denies a missing profile even if user metadata says admin", async () => {
    const headers = { cookie: sessionCookie("no-profile-token") };
    const res = await request(app.base, "/admin/dashboard", { headers });
    expectLocalRedirect(res, app.base, "/admin/access-denied");
    assert.ok(!(await res.text()).includes("District mirror"));
  });

  it("lets a verified admin and policymaker access the dashboard", async () => {
    for (const token of ["admin-token", "policy-token"]) {
      const res = await request(app.base, "/admin/dashboard", { headers: { cookie: sessionCookie(token) } });
      expectNoRedirect(res, 200);
      await expectHtml(res, "District mirror");
    }
    assert.ok(supabase.requests.profiles > 0, "profiles were actually checked");
  });

  it("redirects a signed-in admin away from login only after checking the profile", async () => {
    const res = await request(app.base, "/admin/login?next=https://other.invalid", {
      headers: { cookie: sessionCookie("admin-token") },
    });
    expectLocalRedirect(res, app.base, "/admin/dashboard");
  });

  it("rejects every non-admin mutation with 403, even with admin user metadata", async (t) => {
    for (const [method, path] of adminMutations) {
      await t.test(`${method} ${path}`, async () => {
        const res = await request(app.base, path, {
          method, headers: { cookie: sessionCookie("citizen-token") },
        });
        expectNoRedirect(res, 403);
        assert.match((await res.json()).error, /Official access required/);
      });
    }
  });

  it("fails closed on writes when the service role is not configured", async () => {
    const res = await request(app.base, "/api/recalculate-metrics", {
      method: "POST", headers: { cookie: sessionCookie("admin-token"), "content-type": "application/json" },
      body: "{}",
    });
    expectNoRedirect(res, 500);
  });

  it("preserves refreshed Supabase SSR cookies for the page request and response", async () => {
    const beforeRefresh = supabase.requests.refresh;
    const res = await request(app.base, "/admin/dashboard", {
      headers: { cookie: sessionCookie("admin-token", { expired: true }) },
    });
    expectNoRedirect(res, 200);
    await expectHtml(res, "District mirror");
    assert.ok(supabase.requests.refresh > beforeRefresh, "middleware refreshed the session");
    assert.ok(res.headers.has("set-cookie"), "refreshed cookies reached the browser");
  });

  it("still serves public projects with configured Supabase", async () => {
    expectNoRedirect(await request(app.base, "/projects"), 200);
  });
});

describe("documentation and database policy guardrails", () => {
  it("keeps README free of emojis", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8");
    assert.doesNotMatch(readme, /\p{Extended_Pictographic}|\uFE0F|\u200D/u);
  });

  it("prevents citizen profile self-promotion and direct non-admin writes in the migration", () => {
    const sql = readFileSync(join(root, "supabase/migrations/20260924_admin_authorization.sql"), "utf8");
    assert.match(sql, /for insert with check \(auth\.uid\(\) = id and role = 'citizen'\)/);
    for (const table of ["citizen_reports", "budget_allocations", "budget_uploads", "projects", "ward_category_metrics"]) {
      assert.match(sql, new RegExp(`create policy "official [^"]+" on public\\.${table}\\s+for (?:all|update) using \\(public\\.is_official\\(\\)\\)`));
    }
    assert.match(sql, /bucket_id = 'budget-docs' and public\.is_official\(\)/);
  });
});
