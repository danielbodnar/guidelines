import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { copyFile, type InitOptions } from "../copy.ts";

const makeTemp = (): string =>
	mkdtempSync(join(tmpdir(), "guidelines-test-"));

describe("copyFile", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = makeTemp();
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("creates a new file", async () => {
		const src = join(tempDir, "source.txt");
		const dest = join(tempDir, "dest.txt");
		await Bun.write(src, "hello world");

		const options: InitOptions = { force: false, dryRun: false };
		const result = await copyFile(src, dest, options);

		expect(result.action).toBe("created");
		expect(await Bun.file(dest).text()).toBe("hello world");
	});

	test("skips existing file without --force", async () => {
		const src = join(tempDir, "source.txt");
		const dest = join(tempDir, "dest.txt");
		await Bun.write(src, "new content");
		await Bun.write(dest, "existing content");

		const options: InitOptions = { force: false, dryRun: false };
		const result = await copyFile(src, dest, options);

		expect(result.action).toBe("skipped");
		expect(await Bun.file(dest).text()).toBe("existing content");
	});

	test("overwrites existing file with --force", async () => {
		const src = join(tempDir, "source.txt");
		const dest = join(tempDir, "dest.txt");
		await Bun.write(src, "new content");
		await Bun.write(dest, "existing content");

		const options: InitOptions = { force: true, dryRun: false };
		const result = await copyFile(src, dest, options);

		expect(result.action).toBe("overwritten");
		expect(await Bun.file(dest).text()).toBe("new content");
	});

	test("dry-run does not write file", async () => {
		const src = join(tempDir, "source.txt");
		const dest = join(tempDir, "dest.txt");
		await Bun.write(src, "hello");

		const options: InitOptions = { force: false, dryRun: true };
		const result = await copyFile(src, dest, options);

		expect(result.action).toBe("created");
		expect(await Bun.file(dest).exists()).toBe(false);
	});
});
