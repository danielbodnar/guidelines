import { join } from "node:path";
import type { Manifest } from "../registry/types.ts";
import { resolveToolPath } from "../registry/resolve.ts";
import { ensureParentDir, resolveDestination } from "../utils/paths.ts";
import { green, yellow, dim } from "../utils/format.ts";

export type InitOptions = {
	force: boolean;
	dryRun: boolean;
};

export type CopyResult = {
	action: "created" | "overwritten" | "skipped";
	path: string;
};

/** Copy a single file from source to destination */
export const copyFile = async (
	sourcePath: string,
	destPath: string,
	options: InitOptions,
): Promise<CopyResult> => {
	const exists = await Bun.file(destPath).exists();

	if (options.dryRun) {
		const action = exists ? "overwritten" : "created";
		console.log(
			`  ${dim("[dry-run]")} ${action === "created" ? green("create") : yellow("overwrite")} ${destPath}`,
		);
		return { action, path: destPath };
	}

	if (exists && !options.force) {
		console.log(`  ${yellow("skip")} ${destPath} ${dim("(already exists, use --force to overwrite)")}`);
		return { action: "skipped", path: destPath };
	}

	ensureParentDir(destPath);
	const content = await Bun.file(sourcePath).bytes();
	await Bun.write(destPath, content);

	const action = exists ? "overwritten" : "created";
	console.log(`  ${green(action === "created" ? "create" : "overwrite")} ${destPath}`);
	return { action, path: destPath };
};

/** Process all files from a manifest */
export const processManifestFiles = async (
	manifest: Manifest,
	options: InitOptions,
): Promise<CopyResult[]> => {
	const toolPath = resolveToolPath(manifest);
	const results: CopyResult[] = [];

	for (const file of manifest.files) {
		if (file.strategy === "reference") continue;

		const sourcePath = join(toolPath, file.source);
		const destPath = resolveDestination(file.destination ?? file.source);

		switch (file.strategy) {
			case "copy":
			case "template": {
				const result = await copyFile(sourcePath, destPath, options);
				results.push(result);
				break;
			}
			case "merge": {
				const result = await mergeFile(sourcePath, destPath, options);
				results.push(result);
				break;
			}
			case "append": {
				const result = await appendFile(sourcePath, destPath, options);
				results.push(result);
				break;
			}
		}
	}

	return results;
};

/** Merge JSON content into an existing file */
const mergeFile = async (
	sourcePath: string,
	destPath: string,
	options: InitOptions,
): Promise<CopyResult> => {
	const exists = await Bun.file(destPath).exists();

	if (!exists) {
		return copyFile(sourcePath, destPath, options);
	}

	if (options.dryRun) {
		console.log(`  ${dim("[dry-run]")} ${yellow("merge")} ${destPath}`);
		return { action: "overwritten", path: destPath };
	}

	const source = await Bun.file(sourcePath).json();
	const target = await Bun.file(destPath).json();

	const merged = deepMerge(target, source);
	await Bun.write(destPath, JSON.stringify(merged, null, 2) + "\n");

	console.log(`  ${yellow("merge")} ${destPath}`);
	return { action: "overwritten", path: destPath };
};

/** Append content to an existing file */
const appendFile = async (
	sourcePath: string,
	destPath: string,
	options: InitOptions,
): Promise<CopyResult> => {
	const sourceContent = await Bun.file(sourcePath).text();
	const exists = await Bun.file(destPath).exists();

	if (options.dryRun) {
		console.log(`  ${dim("[dry-run]")} ${exists ? yellow("append") : green("create")} ${destPath}`);
		return { action: exists ? "overwritten" : "created", path: destPath };
	}

	ensureParentDir(destPath);

	if (exists) {
		const existing = await Bun.file(destPath).text();
		if (existing.includes(sourceContent.trim())) {
			console.log(`  ${yellow("skip")} ${destPath} ${dim("(content already present)")}`);
			return { action: "skipped", path: destPath };
		}
		await Bun.write(destPath, existing.trimEnd() + "\n\n" + sourceContent);
		console.log(`  ${yellow("append")} ${destPath}`);
	} else {
		await Bun.write(destPath, sourceContent);
		console.log(`  ${green("create")} ${destPath}`);
	}

	return { action: exists ? "overwritten" : "created", path: destPath };
};

/** Deep merge two objects (target wins for non-object conflicts) */
const deepMerge = (
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): Record<string, unknown> => {
	const result = { ...target };

	for (const key of Object.keys(source)) {
		const sourceVal = source[key];
		const targetVal = target[key];

		if (
			sourceVal &&
			typeof sourceVal === "object" &&
			!Array.isArray(sourceVal) &&
			targetVal &&
			typeof targetVal === "object" &&
			!Array.isArray(targetVal)
		) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>,
			);
		} else {
			result[key] = sourceVal;
		}
	}

	return result;
};
