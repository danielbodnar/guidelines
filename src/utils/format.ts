/** ANSI color helpers (no dependency needed) */
const esc = (code: number) => `\x1b[${code}m`;
const reset = esc(0);

export const bold = (s: string) => `${esc(1)}${s}${reset}`;
export const dim = (s: string) => `${esc(2)}${s}${reset}`;
export const green = (s: string) => `${esc(32)}${s}${reset}`;
export const yellow = (s: string) => `${esc(33)}${s}${reset}`;
export const cyan = (s: string) => `${esc(36)}${s}${reset}`;
export const red = (s: string) => `${esc(31)}${s}${reset}`;
export const magenta = (s: string) => `${esc(35)}${s}${reset}`;

/** Format a key-value pair for display */
export const kv = (key: string, value: string): string =>
	`  ${dim(key + ":")} ${value}`;

/** Format a section header */
export const header = (title: string): string => `\n${bold(cyan(title))}\n`;

/** Format a list item with a bullet */
export const bullet = (text: string): string => `  ${dim("•")} ${text}`;
