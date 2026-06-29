import type { MarkdownPostProcessor } from 'obsidian';
import { parseColorPrefix } from './tokens';

export const colorMarkPostProcessor: MarkdownPostProcessor = (el, _ctx) => {
	const marks = el.querySelectorAll('mark');
	for (let i = 0; i < marks.length; i++) {
		const mark = marks[i];
		const first = mark.firstChild;
		if (!first || first.nodeType !== Node.TEXT_NODE) continue;
		const textNode = first as Text;
		const result = parseColorPrefix(textNode.data);
		if (!result) continue;
		mark.classList.add('hl-' + result.color);
		// Trim only leading data; keep the node so sibling indices stay stable.
		textNode.data = result.rest;
	}
};
