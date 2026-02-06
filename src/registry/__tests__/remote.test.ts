import { describe, expect, test } from "bun:test";
import { loadRegistry, getConfigsDir } from "../index.ts";
import { fetchRemoteConfigs } from "../remote.ts";

describe("fetchRemoteConfigs", () => {
	test("is exported as a function", () => {
		expect(typeof fetchRemoteConfigs).toBe("function");
	});
});

describe("loadRegistry with custom configsDir", () => {
	test("accepts an explicit configs directory", async () => {
		const configsDir = getConfigsDir();
		const registry = await loadRegistry(configsDir);
		expect(registry.categories.size).toBeGreaterThanOrEqual(9);
		expect(registry.tools.size).toBeGreaterThanOrEqual(16);
	});

	test("returns same results when passing default dir explicitly", async () => {
		const defaultRegistry = await loadRegistry();
		const explicitRegistry = await loadRegistry(getConfigsDir());

		expect(explicitRegistry.categories.size).toBe(defaultRegistry.categories.size);
		expect(explicitRegistry.tools.size).toBe(defaultRegistry.tools.size);
	});
});
