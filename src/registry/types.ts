import { z } from "zod";

/** Strategy for how a file should be applied to the target project */
export const FileStrategySchema = z.enum([
	"copy",
	"merge",
	"template",
	"append",
	"reference",
]);

/** A single file entry in the manifest */
export const FileEntrySchema = z.object({
	source: z.string(),
	destination: z.string().optional(),
	strategy: FileStrategySchema.default("copy"),
	description: z.string().optional(),
});

/** The complete manifest for a tool/config */
export const ManifestSchema = z.object({
	name: z.string(),
	displayName: z.string(),
	version: z.string(),
	description: z.string(),
	category: z.string(),
	homepage: z.url().optional(),
	schema: z
		.object({
			url: z.url().optional(),
			vendorUrl: z.url().optional(),
			nodeModulesPath: z.string().optional(),
		})
		.optional(),
	aliases: z.array(z.string()).default([]),
	tags: z.array(z.string()).default([]),
	files: z.array(FileEntrySchema).min(1),
	suggests: z.array(z.string()).default([]),
	requires: z.array(z.string()).default([]),
	dependencies: z.record(z.string(), z.string()).default({}),
	devDependencies: z.record(z.string(), z.string()).default({}),
	scripts: z.record(z.string(), z.string()).default({}),
	variables: z
		.record(
			z.string(),
			z.object({
				description: z.string(),
				default: z.string().optional(),
			}),
		)
		.default({}),
});

/** Category metadata */
export const CategorySchema = z.object({
	name: z.string(),
	displayName: z.string(),
	description: z.string(),
});

export type FileStrategy = z.infer<typeof FileStrategySchema>;
export type FileEntry = z.infer<typeof FileEntrySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type Category = z.infer<typeof CategorySchema>;
