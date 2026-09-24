import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function policyStatements(sql) {
  return [...sql.matchAll(/create policy\s+"[^"]+"[\s\S]*?;/gi)].map((m) => m[0]);
}

describe("supabase SQL bootstrap", () => {
  it("CREATE POLICY statements include ON <table> (SQL Editor otherwise rolls back the whole schema)", () => {
    const files = [
      "supabase/schema.sql",
      "supabase/migrations/20260924000000_admin_authorization.sql",
      "supabase/migrations/20260924000100_fix_rls_policies_and_profile_bootstrap.sql",
    ];
    let count = 0;
    for (const file of files) {
      const sql = readFileSync(join(root, file), "utf8");
      const policies = policyStatements(sql);
      count += policies.length;
      for (const stmt of policies) {
        assert.match(
          stmt,
          /create policy\s+"[^"]+"\s+on\s+(public|storage)\./i,
          `${file}: policy is missing ON table:\n${stmt}`,
        );
      }
    }
    assert.ok(count >= 10, `expected multiple policies, found ${count}`);
  });

  it("schema creates wards and profiles before seed-facing RLS", () => {
    const sql = readFileSync(join(root, "supabase/schema.sql"), "utf8");
    const wards = sql.indexOf("create table if not exists public.wards");
    const profiles = sql.indexOf("create table if not exists public.profiles");
    const rls = sql.indexOf("alter table public.wards enable row level security");
    assert.ok(wards >= 0, "wards table");
    assert.ok(profiles > wards, "profiles after wards");
    assert.ok(rls > profiles, "RLS after tables");
  });

  it("migration chain has unique versions and bootstraps tables before hotfixes", () => {
    const migrationDir = join(root, "supabase/migrations");
    const migrations = readdirSync(migrationDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();
    const versions = migrations.map((file) => file.split("_", 1)[0]);

    assert.equal(new Set(versions).size, versions.length, "migration versions must be unique");
    assert.match(
      readFileSync(join(migrationDir, migrations[0]), "utf8"),
      /create table if not exists public\.profiles/i,
      "the first migration must bootstrap profiles for an empty Preview database",
    );
    assert.ok(
      migrations.indexOf("20260923000000_initial_schema.sql") <
        migrations.indexOf("20260924000000_admin_authorization.sql"),
      "initial schema must run before the admin authorization hotfix",
    );
  });

  it("grant_admin.sql requires an explicit email and upserts an official role", () => {
    const sql = readFileSync(join(root, "supabase/grant_admin.sql"), "utf8");
    assert.match(sql, /REPLACE_WITH_OFFICIAL_EMAIL/);
    assert.match(sql, /insert into public\.profiles/);
    assert.match(sql, /'admin',\s*'policymaker'/);
    assert.match(sql, /from auth\.users/);
  });
});
