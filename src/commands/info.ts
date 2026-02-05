import { defineCommand } from "citty";
import { loadRegistry } from "../registry/index.ts";
import { resolveTool } from "../registry/resolve.ts";
import { bold, cyan, dim, green, yellow, magenta, kv, header, bullet } from "../utils/format.ts";

export const infoCommand = defineCommand({
	meta: {
		name: "info",
		description: "Show detailed information about a tool or config",
	},
	args: {
		tool: {
			type: "positional",
			description: "Tool name to get info for",
			required: true,
		},
	},
	async run({ args }) {
		const registry = await loadRegistry();
		const manifest = resolveTool(registry, args.tool as string);

		if (!manifest) {
			console.error(`Unknown tool: ${args.tool}`);
			console.error(`\nAvailable tools:`);
			for (const name of registry.tools.keys()) {
				console.error(`  ${name}`);
			}
			process.exit(1);
		}

		console.log(header(`${manifest.displayName} v${manifest.version}`));
		console.log(kv("Description", manifest.description));
		console.log(kv("Category", manifest.category));

		if (manifest.homepage) {
			console.log(kv("Homepage", cyan(manifest.homepage)));
		}

		if (manifest.schema) {
			console.log(`\n  ${bold("Schema References:")}`);
			if (manifest.schema.url) {
				console.log(kv("  SchemaStore", cyan(manifest.schema.url)));
			}
			if (manifest.schema.vendorUrl) {
				console.log(kv("  Vendor", cyan(manifest.schema.vendorUrl)));
			}
			if (manifest.schema.nodeModulesPath) {
				console.log(kv("  node_modules", dim(manifest.schema.nodeModulesPath)));
			}
		}

		if (manifest.aliases.length > 0) {
			console.log(kv("Aliases", manifest.aliases.join(", ")));
		}

		if (manifest.tags.length > 0) {
			console.log(kv("Tags", manifest.tags.map((t) => magenta(t)).join(", ")));
		}

		console.log(`\n  ${bold("Files:")}`);
		for (const file of manifest.files) {
			const dest = file.destination ?? file.source;
			const strategy = file.strategy ?? "copy";
			console.log(
				bullet(`${green(dest)} ${dim(`[${strategy}]`)}${file.description ? ` ${dim(file.description)}` : ""}`),
			);
		}

		if (Object.keys(manifest.devDependencies).length > 0) {
			console.log(`\n  ${bold("Dev Dependencies:")}`);
			for (const [pkg, version] of Object.entries(manifest.devDependencies)) {
				console.log(bullet(`${pkg}@${yellow(version)}`));
			}
		}

		if (Object.keys(manifest.scripts).length > 0) {
			console.log(`\n  ${bold("Scripts:")}`);
			for (const [name, cmd] of Object.entries(manifest.scripts)) {
				console.log(bullet(`${bold(name)}: ${dim(cmd)}`));
			}
		}

		if (manifest.suggests.length > 0) {
			console.log(`\n  ${bold("Suggested companions:")} ${manifest.suggests.join(", ")}`);
		}

		if (manifest.requires.length > 0) {
			console.log(`\n  ${bold("Requires:")} ${manifest.requires.join(", ")}`);
		}

		console.log();
	},
});
