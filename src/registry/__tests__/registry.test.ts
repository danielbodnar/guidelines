import { describe, expect, test } from "bun:test";
import { loadRegistry, getConfigsDir } from "../index.ts";

describe("getConfigsDir", () => {
	test("returns a path ending in /configs", () => {
		const dir = getConfigsDir();
		expect(dir).toMatch(/\/configs$/);
	});

	test("returns an absolute path", () => {
		const dir = getConfigsDir();
		expect(dir.startsWith("/")).toBe(true);
	});
});

describe("loadRegistry", () => {
	test("loads all categories", async () => {
		const registry = await loadRegistry();
		expect(registry.categories.size).toBeGreaterThanOrEqual(9);
	});

	test("loads all tools", async () => {
		const registry = await loadRegistry();
		expect(registry.tools.size).toBeGreaterThanOrEqual(16);
	});

	test("populates byCategory map", async () => {
		const registry = await loadRegistry();
		const linters = registry.byCategory.get("linters");
		expect(linters).toBeDefined();
		expect(linters!.length).toBeGreaterThanOrEqual(2);
		expect(linters).toContain("oxlint");
		expect(linters).toContain("biome");
	});

	test("registers aliases", async () => {
		const registry = await loadRegistry();
		expect(registry.aliases.get("oxc")).toBe("oxlint");
		expect(registry.aliases.get("hooks")).toBe("lefthook");
		expect(registry.aliases.get("cloudflare")).toBe("wrangler");
		expect(registry.aliases.get("ci")).toBe("github-actions");
	});

	test("validates manifest fields", async () => {
		const registry = await loadRegistry();
		for (const [name, manifest] of registry.tools) {
			expect(manifest.name).toBe(name);
			expect(manifest.displayName).toBeTruthy();
			expect(manifest.version).toBeTruthy();
			expect(manifest.description).toBeTruthy();
			expect(manifest.category).toBeTruthy();
			expect(manifest.files.length).toBeGreaterThanOrEqual(1);
		}
	});

	test("every tool belongs to a valid category", async () => {
		const registry = await loadRegistry();
		for (const [, manifest] of registry.tools) {
			expect(registry.categories.has(manifest.category)).toBe(true);
		}
	});
});
