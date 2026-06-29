export const TOKEN_PREFIX_RE = /^\{([a-z0-9][a-z0-9-]*)\}/;

export function parseColorPrefix(text: string): { color: string; rest: string } | null {
	const m = text.match(TOKEN_PREFIX_RE);
	if (!m) return null;
	return { color: m[1], rest: text.slice(m[0].length) };
}

export function serializeColorPrefix(color: string, content: string): string {
	return `{${color}}${content}`;
}

export function wrapHighlight(color: string, content: string): string {
	return `==${serializeColorPrefix(color, content)}==`;
}
