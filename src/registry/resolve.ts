import { resolve } from "node:path";
import type { Manifest } from "./types.ts";
import { getConfigsDir, type Registry } from "./index.ts";

/** Resolve a tool name or alias to a Manifest */
export const resolveTool = (
	registry: Registry,
	nameOrAlias: string,
): Manifest | undefined => {
	const lower = nameOrAlias.toLowerCase();
	const direct = registry.tools.get(lower);
	if (direct) return direct;

	const canonical = registry.aliases.get(lower);
	if (canonical) return registry.tools.get(canonical);

	return undefined;
};

/** Resolve the filesystem path to a tool's config directory */
export const resolveToolPath = (manifest: Manifest): string =>
	resolve(getConfigsDir(), manifest.category, manifest.name);
