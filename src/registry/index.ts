import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { ManifestSchema, CategorySchema } from "./types.ts";
import type { Manifest, Category } from "./types.ts";

export type Registry = {
	categories: Map<string, Category>;
	tools: Map<string, Manifest>;
	aliases: Map<string, string>;
	byCategory: Map<string, string[]>;
};

/** Resolve the path to the configs directory within the package */
export const getConfigsDir = (): string =>
	resolve(import.meta.dir, "../../configs");

/** Load the entire registry by scanning a configs directory */
export const loadRegistry = async (
	configsDir = getConfigsDir(),
): Promise<Registry> => {
	const categories = new Map<string, Category>();
	const tools = new Map<string, Manifest>();
	const aliases = new Map<string, string>();
	const byCategory = new Map<string, string[]>();

	for (const entry of readdirSync(configsDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;

		const categoryPath = join(configsDir, entry.name);
		const categoryJsonPath = join(categoryPath, "category.json");

		const rawCategory = await Bun.file(categoryJsonPath).json();
		const category = CategorySchema.parse(rawCategory);
		categories.set(category.name, category);
		byCategory.set(category.name, []);

		for (const toolDir of readdirSync(categoryPath, {
			withFileTypes: true,
		})) {
			if (!toolDir.isDirectory()) continue;

			const manifestPath = join(categoryPath, toolDir.name, "manifest.json");
			if (!await Bun.file(manifestPath).exists()) continue;

			const rawManifest = await Bun.file(manifestPath).json();
			const manifest = ManifestSchema.parse(rawManifest);

			tools.set(manifest.name, manifest);
			byCategory.get(category.name)!.push(manifest.name);

			for (const alias of manifest.aliases) {
				aliases.set(alias, manifest.name);
			}
		}
	}

	return { categories, tools, aliases, byCategory };
};
