import { defineCommand } from "citty";
import { loadRegistry } from "../registry/index.ts";
import { resolveConfigsDir } from "../registry/remote.ts";
import { bold, cyan, dim, header, bullet } from "../utils/format.ts";

export const listCommand = defineCommand({
	meta: {
		name: "list",
		description: "List available categories or tools within a category",
	},
	args: {
		category: {
			type: "positional",
			description: "Category to list tools for (omit to list all categories)",
			required: false,
		},
		remote: {
			type: "boolean",
			alias: "r",
			description: "List configs from GitHub instead of local package",
		},
	},
	async run({ args }) {
		const configsDir = await resolveConfigsDir(args.remote);
		const registry = await loadRegistry(configsDir);

		if (args.category) {
			const catName = args.category as string;
			const toolNames = registry.byCategory.get(catName);

			if (!toolNames) {
				console.error(`Unknown category: ${catName}`);
				console.error(
					`Available: ${Array.from(registry.categories.keys()).join(", ")}`,
				);
				process.exit(1);
			}

			const category = registry.categories.get(catName)!;
			console.log(header(category.displayName));
			console.log(`  ${dim(category.description)}\n`);

			for (const name of toolNames) {
				const tool = registry.tools.get(name)!;
				console.log(
					`  ${bold(cyan(tool.name))} ${dim(`v${tool.version}`)}  ${tool.description}`,
				);
				if (tool.aliases.length > 0) {
					console.log(`    ${dim(`aliases: ${tool.aliases.join(", ")}`)}`);
				}
			}
			console.log();
		} else {
			console.log(header("Available Categories"));

			for (const [name, category] of registry.categories) {
				const count = registry.byCategory.get(name)?.length ?? 0;
				console.log(
					bullet(
						`${bold(cyan(name))} ${dim(`(${count} tools)`)}  ${category.description}`,
					),
				);
			}

			console.log(`\n  ${dim("Run")} guidelines list <category> ${dim("for details")}\n`);
		}
	},
});
