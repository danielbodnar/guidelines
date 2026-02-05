import { resolve, dirname } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

/** Ensure the parent directory of a path exists */
export const ensureParentDir = (filePath: string): void => {
	const dir = dirname(filePath);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
};

/** Resolve a destination path relative to CWD */
export const resolveDestination = (relativePath: string): string =>
	resolve(process.cwd(), relativePath);
