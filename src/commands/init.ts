import { defineCommand } from "citty";
import { loadRegistry, type Registry } from "../registry/index.ts";
import { resolveTool } from "../registry/resolve.ts";
import { processManifestFiles, type InitOptions } from "../operations/copy.ts";
import { bold, cyan, dim, green, yellow, red } from "../utils/format.ts";
import type { Manifest } from "../registry/types.ts";
import * as p from "@clack/prompts";

export const initCommand = defineCommand({
	meta: {
		name: "init",
		description: "Copy config file(s) to current working directory",
	},
	args: {
		tools: {
			type: "positional",
			description: "Tool name(s) to initialize",
			required: false,
		},
		category: {
			type: "string",
			alias: "c",
			description: "Initialize all tools in a category",
		},
		interactive: {
			type: "boolean",
			alias: "i",
			description: "Interactive mode - select tools via prompts",
		},
		force: {
			type: "boolean",
			alias: "f",
			description: "Overwrite existing files without prompting",
		},
		"dry-run": {
			type: "boolean",
			alias: "n",
			description: "Show what would be copied without writing files",
		},
	},
	async run({ args, rawArgs }) {
		const registry = await loadRegistry();
		const options: InitOptions = {
			force: Boolean(args.force),
			dryRun: Boolean(args["dry-run"]),
		};

		let toolNames: string[] = [];

		if (args.interactive) {
			toolNames = await interactiveSelect(registry);
		} else if (args.category) {
			const catTools = registry.byCategory.get(args.category);
			if (!catTools) {
				console.error(`${red("Error:")} Unknown category: ${args.category}`);
				console.error(
					`Available: ${Array.from(registry.categories.keys()).join(", ")}`,
				);
				process.exit(1);
			}
			toolNames = catTools;
		} else {
			// Collect all positional args (citty gives first as args.tools, rest in rawArgs)
			const positionals = collectPositionals(rawArgs);
			if (positionals.length === 0) {
				console.error(`${red("Error:")} Specify tool name(s), --category, or --interactive`);
				console.error(`\n  ${dim("Examples:")}`);
				console.error(`    guidelines init oxlint`);
				console.error(`    guidelines init oxlint biomejs lefthook`);
				console.error(`    guidelines init --category linters`);
				console.error(`    guidelines init --interactive`);
				process.exit(1);
			}
			toolNames = positionals;
		}

		if (options.dryRun) {
			console.log(`\n${dim("[dry-run mode - no files will be written]")}\n`);
		}

		for (const name of toolNames) {
			const manifest = resolveTool(registry, name);
			if (!manifest) {
				console.error(`${red("Error:")} Unknown tool: ${name}`);
				continue;
			}
			await initTool(registry, manifest, options);
		}
	},
});

/** Initialize a single tool */
const initTool = async (
	registry: Registry,
	manifest: Manifest,
	options: InitOptions,
): Promise<void> => {
	console.log(`\n${bold(cyan(manifest.displayName))} ${dim(`v${manifest.version}`)}`);

	// Warn about missing requirements
	for (const req of manifest.requires) {
		const reqManifest = resolveTool(registry, req);
		if (reqManifest) {
			console.log(`  ${yellow("requires")} ${req} ${dim("(ensure it is also initialized)")}`);
		}
	}

	// Process files
	const results = await processManifestFiles(manifest, options);

	// Merge devDependencies into package.json
	if (Object.keys(manifest.devDependencies).length > 0 && !options.dryRun) {
		await mergePackageDeps(manifest, options);
	}

	// Show suggestions
	if (manifest.suggests.length > 0) {
		console.log(
			`  ${dim("suggested:")} ${manifest.suggests.join(", ")}`,
		);
	}

	const created = results.filter((r) => r.action === "created").length;
	const overwritten = results.filter((r) => r.action === "overwritten").length;
	const skipped = results.filter((r) => r.action === "skipped").length;

	if (created > 0) console.log(`  ${green(`${created} created`)}`);
	if (overwritten > 0) console.log(`  ${yellow(`${overwritten} overwritten`)}`);
	if (skipped > 0) console.log(`  ${dim(`${skipped} skipped`)}`);
};

/** Merge manifest devDependencies and scripts into the project's package.json */
const mergePackageDeps = async (
	manifest: Manifest,
	options: InitOptions,
): Promise<void> => {
	const pkgPath = `${process.cwd()}/package.json`;
	const exists = await Bun.file(pkgPath).exists();

	if (!exists) return;

	const pkg = await Bun.file(pkgPath).json();

	let changed = false;

	if (Object.keys(manifest.devDependencies).length > 0) {
		pkg.devDependencies ??= {};
		for (const [name, version] of Object.entries(manifest.devDependencies)) {
			if (!pkg.devDependencies[name]) {
				pkg.devDependencies[name] = version;
				changed = true;
			}
		}
	}

	if (Object.keys(manifest.scripts).length > 0) {
		pkg.scripts ??= {};
		for (const [name, cmd] of Object.entries(manifest.scripts)) {
			if (!pkg.scripts[name]) {
				pkg.scripts[name] = cmd;
				changed = true;
			}
		}
	}

	if (changed && !options.dryRun) {
		await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
		console.log(`  ${green("update")} package.json`);
	}
};

/** Collect positional args from rawArgs (filter out flags) */
const collectPositionals = (rawArgs: string[]): string[] =>
	rawArgs.filter((arg) => !arg.startsWith("-"));

/** Interactive mode using @clack/prompts */
const interactiveSelect = async (registry: Registry): Promise<string[]> => {
	p.intro("guidelines - interactive config setup");

	const selectedCategories = await p.multiselect({
		message: "Which categories do you need?",
		options: Array.from(registry.categories.values()).map((cat) => ({
			value: cat.name,
			label: cat.displayName,
			hint: cat.description,
		})),
	});

	if (p.isCancel(selectedCategories)) {
		p.cancel("Cancelled");
		process.exit(0);
	}

	const selectedTools: string[] = [];

	for (const cat of selectedCategories) {
		const toolNames = registry.byCategory.get(cat) ?? [];
		const tools = toolNames
			.map((name) => registry.tools.get(name)!)
			.filter(Boolean);

		const selected = await p.multiselect({
			message: `Select ${cat} tools:`,
			options: tools.map((t) => ({
				value: t.name,
				label: `${t.displayName} v${t.version}`,
				hint: t.description,
			})),
		});

		if (p.isCancel(selected)) {
			p.cancel("Cancelled");
			process.exit(0);
		}

		selectedTools.push(...selected);
	}

	p.outro(`Selected ${selectedTools.length} tool(s)`);
	return selectedTools;
};
