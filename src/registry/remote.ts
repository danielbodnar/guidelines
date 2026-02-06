import { downloadTemplate } from "giget";

const REMOTE_SOURCE = "gh:danielbodnar/guidelines/configs";

/**
 * Fetch the configs directory from GitHub via giget.
 * Returns the local filesystem path to the downloaded configs.
 * Uses giget's built-in caching (preferOffline) for fast repeat fetches.
 */
export const fetchRemoteConfigs = async (options?: {
	force?: boolean;
}): Promise<string> => {
	const result = await downloadTemplate(REMOTE_SOURCE, {
		preferOffline: !options?.force,
		force: options?.force ?? false,
		install: false,
		silent: true,
	});

	return result.dir;
};
