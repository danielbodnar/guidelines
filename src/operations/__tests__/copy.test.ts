import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { copyFile, templateFile, type InitOptions } from "../copy.ts";

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

describe("templateFile", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = makeTemp();
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("substitutes {{KEY}} placeholders", async () => {
		const src = join(tempDir, "template.txt");
		const dest = join(tempDir, "output.txt");
		await Bun.write(src, "Hello {{NAME}}, welcome to {{PROJECT}}!");

		const options: InitOptions = { force: false, dryRun: false };
		const result = await templateFile(src, dest, { NAME: "Daniel", PROJECT: "guidelines" }, options);

		expect(result.action).toBe("created");
		expect(await Bun.file(dest).text()).toBe("Hello Daniel, welcome to guidelines!");
	});

	test("replaces all occurrences of the same variable", async () => {
		const src = join(tempDir, "template.txt");
		const dest = join(tempDir, "output.txt");
		await Bun.write(src, "{{APP}} is great. I love {{APP}}.");

		const options: InitOptions = { force: false, dryRun: false };
		const result = await templateFile(src, dest, { APP: "guidelines" }, options);

		expect(result.action).toBe("created");
		expect(await Bun.file(dest).text()).toBe("guidelines is great. I love guidelines.");
	});

	test("leaves unresolved placeholders intact", async () => {
		const src = join(tempDir, "template.txt");
		const dest = join(tempDir, "output.txt");
		await Bun.write(src, "{{KNOWN}} and {{UNKNOWN}}");

		const options: InitOptions = { force: false, dryRun: false };
		const result = await templateFile(src, dest, { KNOWN: "resolved" }, options);

		expect(result.action).toBe("created");
		expect(await Bun.file(dest).text()).toBe("resolved and {{UNKNOWN}}");
	});

	test("skips existing file without --force", async () => {
		const src = join(tempDir, "template.txt");
		const dest = join(tempDir, "output.txt");
		await Bun.write(src, "{{VAR}}");
		await Bun.write(dest, "existing");

		const options: InitOptions = { force: false, dryRun: false };
		const result = await templateFile(src, dest, { VAR: "new" }, options);

		expect(result.action).toBe("skipped");
		expect(await Bun.file(dest).text()).toBe("existing");
	});

	test("overwrites existing file with --force", async () => {
		const src = join(tempDir, "template.txt");
		const dest = join(tempDir, "output.txt");
		await Bun.write(src, "Hello {{NAME}}!");
		await Bun.write(dest, "existing content");

		const options: InitOptions = { force: true, dryRun: false };
		const result = await templateFile(src, dest, { NAME: "World" }, options);

		expect(result.action).toBe("overwritten");
		expect(await Bun.file(dest).text()).toBe("Hello World!");
	});

	test("dry-run does not write file", async () => {
		const src = join(tempDir, "template.txt");
		const dest = join(tempDir, "output.txt");
		await Bun.write(src, "{{VAR}}");

		const options: InitOptions = { force: false, dryRun: true };
		const result = await templateFile(src, dest, { VAR: "value" }, options);

		expect(result.action).toBe("created");
		expect(await Bun.file(dest).exists()).toBe(false);
	});
});
