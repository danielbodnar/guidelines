#!/usr/bin/env bun

import { defineCommand, runMain } from "citty";
import { listCommand } from "./commands/list.ts";
import { initCommand } from "./commands/init.ts";
import { infoCommand } from "./commands/info.ts";

const main = defineCommand({
	meta: {
		name: "guidelines",
		version: "0.1.0",
		description:
			"Centralized config files, templates, and guidelines for linters, formatters, editors, CI/CD, and more",
	},
	subCommands: {
		list: listCommand,
		init: initCommand,
		info: infoCommand,
	},
});

runMain(main);
