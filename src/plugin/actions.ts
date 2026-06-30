import type { Editor } from 'obsidian';
import { wrapHighlight } from '../parser/tokens';

// Slug is capturing-optional; content is always group 2. Matches both
// our token form =={slug}content== and Obsidian-native ==content==.
const ANY_HIGHLIGHT_RE = /==(?:\{([a-z0-9][a-z0-9-]*)\})?([^=\n]+(?:=[^=\n]+)*?)==/g;
// Highlightr-style HTML mark — supports migration of legacy notes.
const MARK_RE = /<mark\b[^>]*>([^<]*?)<\/mark>/gi;
// Unified strip pattern for wrapWithColor — content lives in group 1 (== form) or group 2 (mark form).
const STRIP_RE = /==(?:\{[a-z0-9][a-z0-9-]*\})?([^=\n]+(?:=[^=\n]+)*?)==|<mark\b[^>]*>([^<]*?)<\/mark>/gi;

export interface ActiveHighlight {
	line: number;
	start: number;
	end: number;
	color: string | null; // null = native ==content== without a slug token
	content: string;
}

export function findHighlightAt(editor: Editor, line: number, ch: number): ActiveHighlight | null {
	const text = editor.getLine(line);
	ANY_HIGHLIGHT_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = ANY_HIGHLIGHT_RE.exec(text)) !== null) {
		const start = m.index;
		const end = start + m[0].length;
		if (ch >= start && ch <= end) {
			return { line, start, end, color: m[1] ?? null, content: m[2] };
		}
	}
	MARK_RE.lastIndex = 0;
	while ((m = MARK_RE.exec(text)) !== null) {
		const start = m.index;
		const end = start + m[0].length;
		if (ch >= start && ch <= end) {
			return { line, start, end, color: null, content: m[1] };
		}
	}
	return null;
}

export function wrapWithColor(editor: Editor, color: string): void {
	const ranges = editor.listSelections();
	if (ranges.length !== 1) return;
	const sel = ranges[0];
	if (sel.anchor.line !== sel.head.line) {
		// Multi-line selection: fall back to plain wrap with strip.
		const selection = editor.getSelection();
		if (!selection) return;
		STRIP_RE.lastIndex = 0;
		const stripped = selection.replace(STRIP_RE, (_match: string, eq: string | undefined, mk: string | undefined): string => eq ?? mk ?? '');
		editor.replaceSelection(wrapHighlight(color, stripped));
		return;
	}
	const line = sel.anchor.line;
	const startCh = Math.min(sel.anchor.ch, sel.head.ch);
	const endCh = Math.max(sel.anchor.ch, sel.head.ch);
	if (startCh === endCh) return;

	const lineText = editor.getLine(line);

	// 1) Split: if the selection sits fully inside the content of one =={slug}…== or ==…==,
	//    split it into [prefix-highlight] [new-highlight] [suffix-highlight].
	ANY_HIGHLIGHT_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	while ((m = ANY_HIGHLIGHT_RE.exec(lineText)) !== null) {
		const matchStart = m.index;
		const matchEnd = matchStart + m[0].length;
		const slug = m[1] ?? null;
		const contentStart = slug !== null ? matchStart + 2 + slug.length + 2 : matchStart + 2;
		const contentEnd = matchEnd - 2;
		if (contentStart <= startCh && endCh <= contentEnd) {
			// Trim inner-facing whitespace so the resulting markers don't end up like ` ==`
			// or `== ` (Obsidian sometimes refuses to render highlights with adjacent spaces).
			const prefix = lineText.slice(contentStart, startCh).replace(/\s+$/, '');
			const selected = lineText.slice(startCh, endCh);
			const suffix = lineText.slice(endCh, contentEnd).replace(/^\s+/, '');
			const rewrap = (c: string | null, content: string) =>
				c !== null ? `=={${c}}${content}==` : `==${content}==`;
			const parts: string[] = [];
			if (prefix) parts.push(rewrap(slug, prefix));
			parts.push(wrapHighlight(color, selected));
			if (suffix) parts.push(rewrap(slug, suffix));
			editor.replaceRange(
				parts.join(' '),
				{ line, ch: matchStart },
				{ line, ch: matchEnd },
			);
			return;
		}
	}

	// 2) Absorb: expand the wrap range to fully include any highlight that overlaps the selection,
	//    then strip inner wrappers so the outer wrap is clean.
	let finalStart = startCh;
	let finalEnd = endCh;
	const absorb = (re: RegExp) => {
		re.lastIndex = 0;
		let mm: RegExpExecArray | null;
		while ((mm = re.exec(lineText)) !== null) {
			const s = mm.index;
			const e = s + mm[0].length;
			if (s < endCh && e > startCh) {
				if (s < finalStart) finalStart = s;
				if (e > finalEnd) finalEnd = e;
			}
		}
	};
	absorb(ANY_HIGHLIGHT_RE);
	absorb(MARK_RE);

	const expanded = lineText.slice(finalStart, finalEnd);
	STRIP_RE.lastIndex = 0;
	const stripped = expanded.replace(STRIP_RE, (_match: string, eq: string | undefined, mk: string | undefined): string => eq ?? mk ?? '');
	editor.replaceRange(
		wrapHighlight(color, stripped),
		{ line, ch: finalStart },
		{ line, ch: finalEnd },
	);
}

export function changeColor(editor: Editor, h: ActiveHighlight, newColor: string): void {
	// Replace the entire highlight region with our token form — works for token, native, and <mark>.
	editor.replaceRange(
		wrapHighlight(newColor, h.content),
		{ line: h.line, ch: h.start },
		{ line: h.line, ch: h.end },
	);
}

export function unhighlight(editor: Editor, h: ActiveHighlight): void {
	editor.replaceRange(
		h.content,
		{ line: h.line, ch: h.start },
		{ line: h.line, ch: h.end },
	);
}

/** Unified backtick-context decision. The line's backticks are paired off (0-1, 2-3, …);
 *  any pair that overlaps the selection causes us to "absorb" — expand the wrap range to
 *  the union of the selection and every overlapping pair. wrapFlow then strips backticks
 *  from that region and wraps only the selection. */
export type BacktickContext =
	| { kind: 'outside' }
	| { kind: 'absorb'; absorbStart: number; absorbEnd: number };

export function detectBacktickContext(
	lineText: string,
	startCh: number,
	endCh: number,
): BacktickContext {
	const ticks: number[] = [];
	for (let i = 0; i < lineText.length; i++) {
		if (lineText[i] === '`') ticks.push(i);
	}
	let absorbStart = startCh;
	let absorbEnd = endCh;
	let absorbed = false;
	// Walk pairs (0,1), (2,3), … — an odd trailing tick (no partner) is ignored, matching
	// CommonMark's "unpaired backtick is literal" rule.
	for (let i = 0; i + 1 < ticks.length; i += 2) {
		const pairStart = ticks[i];
		const pairEnd = ticks[i + 1] + 1; // exclusive
		if (pairStart < endCh && pairEnd > startCh) {
			if (pairStart < absorbStart) absorbStart = pairStart;
			if (pairEnd > absorbEnd) absorbEnd = pairEnd;
			absorbed = true;
		}
	}
	return absorbed ? { kind: 'absorb', absorbStart, absorbEnd } : { kind: 'outside' };
}

/** Decision encoded as a discriminated union: what should a color command do given the
 *  current editor state? `wrap` if there's a selection, `change` if the cursor sits inside
 *  an existing highlight, `none` otherwise (command should be unavailable). */
export type ColorCommandAction =
	| { kind: 'wrap' }
	| { kind: 'change'; highlight: ActiveHighlight }
	| { kind: 'none' };

export function resolveColorCommandAction(editor: Editor): ColorCommandAction {
	if (editor.somethingSelected()) return { kind: 'wrap' };
	const cursor = editor.getCursor('head');
	const active = findHighlightAt(editor, cursor.line, cursor.ch);
	if (active) return { kind: 'change', highlight: active };
	return { kind: 'none' };
}

/** True when the current selection contains at least one highlight wrapper. */
export function selectionContainsHighlight(editor: Editor): boolean {
	const sel = editor.getSelection();
	if (!sel) return false;
	STRIP_RE.lastIndex = 0;
	return STRIP_RE.test(sel);
}

/** Strip every highlight (=={slug}…==, ==…==, <mark>…</mark>) inside the current selection.
 *  On a single-line selection the range is first expanded to absorb any highlight it overlaps,
 *  so a partial selection still unhighlights the whole highlight. */
export function unhighlightSelection(editor: Editor): void {
	const ranges = editor.listSelections();
	if (ranges.length !== 1) return;
	const sel = ranges[0];

	if (sel.anchor.line !== sel.head.line) {
		// Multi-line: strip whatever the selected string captures; partial highlights at the edges stay.
		const selection = editor.getSelection();
		if (!selection) return;
		STRIP_RE.lastIndex = 0;
		const stripped = selection.replace(STRIP_RE, (_match: string, eq: string | undefined, mk: string | undefined): string => eq ?? mk ?? '');
		if (stripped !== selection) editor.replaceSelection(stripped);
		return;
	}

	const line = sel.anchor.line;
	const startCh = Math.min(sel.anchor.ch, sel.head.ch);
	const endCh = Math.max(sel.anchor.ch, sel.head.ch);
	if (startCh === endCh) return;

	const lineText = editor.getLine(line);
	let finalStart = startCh;
	let finalEnd = endCh;
	const absorb = (re: RegExp) => {
		re.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = re.exec(lineText)) !== null) {
			const s = m.index;
			const e = s + m[0].length;
			if (s < endCh && e > startCh) {
				if (s < finalStart) finalStart = s;
				if (e > finalEnd) finalEnd = e;
			}
		}
	};
	absorb(ANY_HIGHLIGHT_RE);
	absorb(MARK_RE);

	const expanded = lineText.slice(finalStart, finalEnd);
	STRIP_RE.lastIndex = 0;
	const stripped = expanded.replace(STRIP_RE, (_match: string, eq: string | undefined, mk: string | undefined): string => eq ?? mk ?? '');
	if (stripped !== expanded) {
		editor.replaceRange(stripped, { line, ch: finalStart }, { line, ch: finalEnd });
	}
}
