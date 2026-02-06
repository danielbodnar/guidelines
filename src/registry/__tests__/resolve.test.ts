import { describe, expect, test } from "bun:test";
import { loadRegistry } from "../index.ts";
import { resolveTool, resolveToolPath } from "../resolve.ts";

describe("resolveTool", () => {
	test("resolves by exact name", async () => {
		const registry = await loadRegistry();
		const tool = resolveTool(registry, "oxlint");
		expect(tool).toBeDefined();
		expect(tool!.name).toBe("oxlint");
	});

	test("resolves by alias", async () => {
		const registry = await loadRegistry();
		const tool = resolveTool(registry, "hooks");
		expect(tool).toBeDefined();
		expect(tool!.name).toBe("lefthook");
	});

	test("returns undefined for unknown tool", async () => {
		const registry = await loadRegistry();
		const tool = resolveTool(registry, "nonexistent-tool");
		expect(tool).toBeUndefined();
	});

	test("is case-insensitive", async () => {
		const registry = await loadRegistry();
		const tool = resolveTool(registry, "OXLINT");
		expect(tool).toBeDefined();
		expect(tool!.name).toBe("oxlint");
	});
});

describe("resolveToolPath", () => {
	test("returns path with category and tool name", async () => {
		const registry = await loadRegistry();
		const tool = resolveTool(registry, "oxlint")!;
		const path = resolveToolPath(tool);
		expect(path).toMatch(/configs\/linters\/oxlint$/);
	});

	test("works for nested destination tools", async () => {
		const registry = await loadRegistry();
		const tool = resolveTool(registry, "wrangler")!;
		const path = resolveToolPath(tool);
		expect(path).toMatch(/configs\/infrastructure\/wrangler$/);
	});
});
