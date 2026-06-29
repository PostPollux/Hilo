import { describe, it, expect } from 'vitest';
import type { Editor, EditorSelection } from 'obsidian';
import {
	findHighlightAt,
	wrapWithColor,
	changeColor,
	unhighlight,
	selectionContainsHighlight,
	unhighlightSelection,
	resolveColorCommandAction,
	detectBacktickContext,
} from './actions';

// ------------------------------------------------------------------
// Minimal Editor mock — implements only the methods actions.ts touches.
// ------------------------------------------------------------------
function createMockEditor(
	content: string,
	selection?: EditorSelection,
): Editor & { text: () => string } {
	const state = {
		lines: content.split('\n'),
		selections: selection ? [selection] : ([] as EditorSelection[]),
	};
	const editor = {
		getLine(n: number) {
			return state.lines[n] ?? '';
		},
		getCursor(_which?: string) {
			return state.selections[0]?.head ?? { line: 0, ch: 0 };
		},
		listSelections(): EditorSelection[] {
			return state.selections;
		},
		somethingSelected() {
			return state.selections.some(
				(s) => s.anchor.line !== s.head.line || s.anchor.ch !== s.head.ch,
			);
		},
		getSelection() {
			if (state.selections.length === 0) return '';
			const s = state.selections[0];
			const startLine = Math.min(s.anchor.line, s.head.line);
			const endLine = Math.max(s.anchor.line, s.head.line);
			let startCh: number;
			let endCh: number;
			if (s.anchor.line === s.head.line) {
				startCh = Math.min(s.anchor.ch, s.head.ch);
				endCh = Math.max(s.anchor.ch, s.head.ch);
			} else {
				const forward =
					s.anchor.line < s.head.line ||
					(s.anchor.line === s.head.line && s.anchor.ch < s.head.ch);
				startCh = forward ? s.anchor.ch : s.head.ch;
				endCh = forward ? s.head.ch : s.anchor.ch;
			}
			if (startLine === endLine) {
				return state.lines[startLine].slice(startCh, endCh);
			}
			const parts: string[] = [state.lines[startLine].slice(startCh)];
			for (let i = startLine + 1; i < endLine; i++) parts.push(state.lines[i]);
			parts.push(state.lines[endLine].slice(0, endCh));
			return parts.join('\n');
		},
		replaceSelection(text: string) {
			if (state.selections.length === 0) return;
			const s = state.selections[0];
			if (s.anchor.line === s.head.line) {
				const startCh = Math.min(s.anchor.ch, s.head.ch);
				const endCh = Math.max(s.anchor.ch, s.head.ch);
				const line = state.lines[s.anchor.line];
				state.lines[s.anchor.line] = line.slice(0, startCh) + text + line.slice(endCh);
			}
		},
		replaceRange(
			text: string,
			from: { line: number; ch: number },
			to: { line: number; ch: number },
		) {
			if (from.line === to.line) {
				const line = state.lines[from.line];
				state.lines[from.line] = line.slice(0, from.ch) + text + line.slice(to.ch);
			}
		},
		text() {
			return state.lines.join('\n');
		},
	};
	return editor as unknown as Editor & { text: () => string };
}

function selOn(line: number, startCh: number, endCh: number): EditorSelection {
	return { anchor: { line, ch: startCh }, head: { line, ch: endCh } };
}

// ------------------------------------------------------------------
// findHighlightAt
// ------------------------------------------------------------------
describe('findHighlightAt', () => {
	it('matches our token form and returns slug as color', () => {
		const ed = createMockEditor('text =={1st}hello== rest');
		const h = findHighlightAt(ed, 0, 12); // inside "hello"
		expect(h).toEqual({ line: 0, start: 5, end: 19, color: '1st', content: 'hello' });
	});
	it('matches native ==content== and returns color null', () => {
		const ed = createMockEditor('text ==hello== rest');
		const h = findHighlightAt(ed, 0, 10);
		expect(h?.color).toBeNull();
		expect(h?.content).toBe('hello');
	});
	it('matches <mark>…</mark> form and returns color null', () => {
		const ed = createMockEditor('text <mark style="background: pink;">hello</mark> rest');
		const h = findHighlightAt(ed, 0, 40);
		expect(h?.color).toBeNull();
		expect(h?.content).toBe('hello');
	});
	it('returns null when cursor is outside any highlight', () => {
		const ed = createMockEditor('text =={1st}hello== rest');
		expect(findHighlightAt(ed, 0, 2)).toBeNull();
		expect(findHighlightAt(ed, 0, 22)).toBeNull();
	});
	it('handles digit-start slugs (1st / 2nd / 7th)', () => {
		const ed = createMockEditor('=={7th}content==');
		const h = findHighlightAt(ed, 0, 10);
		expect(h?.color).toBe('7th');
	});
});

// ------------------------------------------------------------------
// wrapWithColor — simple wrap (no existing highlights involved)
// ------------------------------------------------------------------
describe('wrapWithColor — simple wrap', () => {
	it('wraps a plain selection', () => {
		const ed = createMockEditor('hello world', selOn(0, 0, 5));
		wrapWithColor(ed, 'yellow');
		expect(ed.text()).toBe('=={yellow}hello== world');
	});
	it('no-op on empty selection', () => {
		const ed = createMockEditor('hello world', selOn(0, 5, 5));
		wrapWithColor(ed, 'yellow');
		expect(ed.text()).toBe('hello world');
	});
});

// ------------------------------------------------------------------
// wrapWithColor — split (selection fully inside one highlight's content)
// ------------------------------------------------------------------
describe('wrapWithColor — split', () => {
	it('splits a highlight when the selection is strictly inside its content', () => {
		// "=={1st}foo bar baz==" — select "bar" (ch 11..14)
		const ed = createMockEditor('=={1st}foo bar baz==', selOn(0, 11, 14));
		wrapWithColor(ed, '2nd');
		expect(ed.text()).toBe('=={1st}foo== =={2nd}bar== =={1st}baz==');
	});
	it('split trims prefix trailing whitespace and suffix leading whitespace', () => {
		// "=={1st} 안에서만 움직이도록 통제==" — select "통제"
		const ed = createMockEditor('=={1st} 안에서만 움직이도록 통제==');
		const startCh = ed.text().indexOf('통제');
		const endCh = startCh + 2;
		const ed2 = createMockEditor('=={1st} 안에서만 움직이도록 통제==', selOn(0, startCh, endCh));
		wrapWithColor(ed2, 'blue');
		expect(ed2.text()).toBe('=={1st} 안에서만 움직이도록== =={blue}통제==');
	});
	it('skips empty prefix when selection starts at content start', () => {
		// content "foo bar" — select "foo " (entire prefix + space) is contentStart..endCh=4
		// Use simpler: select "foo" at the start
		const ed = createMockEditor('=={1st}foo bar==', selOn(0, 7, 10));
		wrapWithColor(ed, '2nd');
		expect(ed.text()).toBe('=={2nd}foo== =={1st}bar==');
	});
	it('skips empty suffix when selection ends at content end', () => {
		const ed = createMockEditor('=={1st}foo bar==', selOn(0, 11, 14));
		wrapWithColor(ed, '2nd');
		expect(ed.text()).toBe('=={1st}foo== =={2nd}bar==');
	});
	it('split when selection equals the entire content acts like a color change', () => {
		const ed = createMockEditor('=={1st}foo==', selOn(0, 7, 10));
		wrapWithColor(ed, '2nd');
		expect(ed.text()).toBe('=={2nd}foo==');
	});
	it('split inside a native ==content== preserves native wrappers for prefix/suffix', () => {
		const ed = createMockEditor('==foo bar baz==', selOn(0, 6, 9));
		wrapWithColor(ed, '1st');
		expect(ed.text()).toBe('==foo== =={1st}bar== ==baz==');
	});
});

// ------------------------------------------------------------------
// wrapWithColor — absorb (selection crosses highlight boundaries)
// ------------------------------------------------------------------
describe('wrapWithColor — absorb', () => {
	it('absorbs an existing highlight when the selection extends past its boundary', () => {
		// "=={1st}hello== world" — select "hello== world" (from inside highlight to end of line)
		const text = '=={1st}hello== world';
		const ed = createMockEditor(text, selOn(0, 7, text.length));
		wrapWithColor(ed, '2nd');
		// Selection [7, 20] overlaps highlight [0, 14] → expand to [0, 20]
		expect(ed.text()).toBe('=={2nd}hello world==');
	});
	it('absorbs multiple highlights in a single selection', () => {
		const text = 'a =={1st}b== c =={2nd}d== e';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		wrapWithColor(ed, 'green');
		expect(ed.text()).toBe('=={green}a b c d e==');
	});
	it('absorbs a <mark> wrapper just like our token form', () => {
		const text = '<mark>foo</mark> bar';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		wrapWithColor(ed, '1st');
		expect(ed.text()).toBe('=={1st}foo bar==');
	});
});

// ------------------------------------------------------------------
// wrapWithColor — multi-line fallback
// ------------------------------------------------------------------
describe('wrapWithColor — multi-line fallback', () => {
	it('calls replaceSelection exactly once with stripped + wrapped text', () => {
		const ed = createMockEditor('=={1st}foo==\nbar', {
			anchor: { line: 0, ch: 0 },
			head: { line: 1, ch: 3 },
		});
		const calls: string[] = [];
		const orig = ed.replaceSelection.bind(ed);
		ed.replaceSelection = (text: string) => {
			calls.push(text);
			orig(text);
		};
		wrapWithColor(ed, '2nd');
		expect(calls).toHaveLength(1);
		expect(calls[0].startsWith('=={2nd}')).toBe(true);
		expect(calls[0].endsWith('==')).toBe(true);
		expect(calls[0]).not.toContain('=={1st}'); // inner highlight stripped
	});
});

// ------------------------------------------------------------------
// changeColor — unified replacement
// ------------------------------------------------------------------
describe('changeColor', () => {
	it('replaces a token-form highlight with our token form (new color)', () => {
		const ed = createMockEditor('text =={1st}hello== rest');
		const h = findHighlightAt(ed, 0, 12)!;
		changeColor(ed, h, '2nd');
		expect(ed.text()).toBe('text =={2nd}hello== rest');
	});
	it('migrates a native ==content== into our token form', () => {
		const ed = createMockEditor('text ==hello== rest');
		const h = findHighlightAt(ed, 0, 10)!;
		changeColor(ed, h, '1st');
		expect(ed.text()).toBe('text =={1st}hello== rest');
	});
	it('migrates a <mark>…</mark> into our token form', () => {
		const ed = createMockEditor('text <mark style="background: pink;">hello</mark> rest');
		const h = findHighlightAt(ed, 0, 40)!;
		changeColor(ed, h, '1st');
		expect(ed.text()).toBe('text =={1st}hello== rest');
	});
});

// ------------------------------------------------------------------
// unhighlight — uniform strip
// ------------------------------------------------------------------
describe('unhighlight', () => {
	it('removes a token-form highlight, keeping content', () => {
		const ed = createMockEditor('text =={1st}hello== rest');
		const h = findHighlightAt(ed, 0, 12)!;
		unhighlight(ed, h);
		expect(ed.text()).toBe('text hello rest');
	});
	it('removes a native ==content== highlight', () => {
		const ed = createMockEditor('text ==hello== rest');
		const h = findHighlightAt(ed, 0, 10)!;
		unhighlight(ed, h);
		expect(ed.text()).toBe('text hello rest');
	});
	it('removes a <mark> wrapper', () => {
		const ed = createMockEditor('text <mark>hello</mark> rest');
		const h = findHighlightAt(ed, 0, 14)!;
		unhighlight(ed, h);
		expect(ed.text()).toBe('text hello rest');
	});
});

// ------------------------------------------------------------------
// selectionContainsHighlight
// ------------------------------------------------------------------
describe('selectionContainsHighlight', () => {
	it('returns false for an empty selection', () => {
		const ed = createMockEditor('hello world', selOn(0, 5, 5));
		expect(selectionContainsHighlight(ed)).toBe(false);
	});
	it('returns false for a plain text selection', () => {
		const ed = createMockEditor('hello world', selOn(0, 0, 5));
		expect(selectionContainsHighlight(ed)).toBe(false);
	});
	it('returns true when selection contains a token-form highlight', () => {
		const text = 'a =={1st}b== c';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		expect(selectionContainsHighlight(ed)).toBe(true);
	});
	it('returns true when selection contains a native ==content== highlight', () => {
		const text = 'a ==b== c';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		expect(selectionContainsHighlight(ed)).toBe(true);
	});
	it('returns true when selection contains a <mark> wrapper', () => {
		const text = 'a <mark>b</mark> c';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		expect(selectionContainsHighlight(ed)).toBe(true);
	});
});

// ------------------------------------------------------------------
// unhighlightSelection
// ------------------------------------------------------------------
describe('unhighlightSelection', () => {
	it('strips a single highlight even when only partially selected (single-line absorb)', () => {
		const text = '=={1st}hello== rest';
		// Select only "ell" inside the highlight.
		const ed = createMockEditor(text, selOn(0, 8, 11));
		unhighlightSelection(ed);
		expect(ed.text()).toBe('hello rest');
	});
	it('strips multiple highlights when the selection spans them all', () => {
		const text = 'a =={1st}b== c =={2nd}d== e';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		unhighlightSelection(ed);
		expect(ed.text()).toBe('a b c d e');
	});
	it('strips a <mark> wrapper inside the selection', () => {
		const text = 'a <mark>b</mark> c';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		unhighlightSelection(ed);
		expect(ed.text()).toBe('a b c');
	});
	it('no-op when the selection contains no highlight', () => {
		const text = 'hello world';
		const ed = createMockEditor(text, selOn(0, 0, text.length));
		unhighlightSelection(ed);
		expect(ed.text()).toBe('hello world');
	});
	it('no-op on empty selection', () => {
		const ed = createMockEditor('=={1st}foo==', selOn(0, 0, 0));
		unhighlightSelection(ed);
		expect(ed.text()).toBe('=={1st}foo==');
	});
});

// ------------------------------------------------------------------
// resolveColorCommandAction — decides what a color hotkey should do
// based on selection / cursor position.
// ------------------------------------------------------------------
describe('resolveColorCommandAction', () => {
	it('returns "wrap" when there is a non-empty selection', () => {
		const ed = createMockEditor('hello world', selOn(0, 0, 5));
		expect(resolveColorCommandAction(ed)).toEqual({ kind: 'wrap' });
	});
	it('returns "change" with the active highlight when cursor is inside one (no selection)', () => {
		const ed = createMockEditor('text =={1st}hello== rest', selOn(0, 12, 12));
		const result = resolveColorCommandAction(ed);
		expect(result.kind).toBe('change');
		if (result.kind === 'change') {
			expect(result.highlight.color).toBe('1st');
			expect(result.highlight.content).toBe('hello');
		}
	});
	it('returns "change" for native ==content== under cursor', () => {
		const ed = createMockEditor('text ==hello== rest', selOn(0, 10, 10));
		const result = resolveColorCommandAction(ed);
		expect(result.kind).toBe('change');
		if (result.kind === 'change') expect(result.highlight.color).toBeNull();
	});
	it('returns "change" for <mark> under cursor', () => {
		const ed = createMockEditor('text <mark>hello</mark> rest', selOn(0, 14, 14));
		const result = resolveColorCommandAction(ed);
		expect(result.kind).toBe('change');
	});
	it('returns "none" when no selection and cursor is outside any highlight', () => {
		const ed = createMockEditor('text =={1st}hello== rest', selOn(0, 2, 2));
		expect(resolveColorCommandAction(ed)).toEqual({ kind: 'none' });
	});
	it('prefers "wrap" over "change" when selection is non-empty even inside a highlight', () => {
		// "=={1st}hello==" — select "ell" inside content; selection wins.
		const ed = createMockEditor('=={1st}hello==', selOn(0, 8, 11));
		expect(resolveColorCommandAction(ed)).toEqual({ kind: 'wrap' });
	});
});

// ------------------------------------------------------------------
// detectBacktickContext — unified absorb-based decision used by wrapWithColor.
//   - "outside": no backtick pair overlaps the selection → proceed with normal wrap.
//   - "absorb":  at least one paired backtick block overlaps the selection.
//                The absorb region is the union of the selection and every overlapping pair.
// ------------------------------------------------------------------
describe('detectBacktickContext', () => {
	it('returns "outside" when there are no backticks on the line', () => {
		expect(detectBacktickContext('plain text', 0, 5)).toEqual({ kind: 'outside' });
	});
	it('returns "outside" when the line has only a single unpaired backtick', () => {
		expect(detectBacktickContext('`foo bar baz', 1, 4)).toEqual({ kind: 'outside' });
	});
	it('returns "outside" when the selection sits entirely outside the backtick pair', () => {
		// "before `code` after" — select "before"
		expect(detectBacktickContext('before `code` after', 0, 6)).toEqual({ kind: 'outside' });
	});
	it('absorbs a backtick pair when the selection equals its content', () => {
		// "`word`" — select "word"
		expect(detectBacktickContext('`word`', 1, 5)).toEqual({
			kind: 'absorb',
			absorbStart: 0,
			absorbEnd: 6,
		});
	});
	it('absorbs a backtick pair when the selection is a strict subrange of its content', () => {
		// "`hello`" — select "ell"
		expect(detectBacktickContext('`hello`', 2, 5)).toEqual({
			kind: 'absorb',
			absorbStart: 0,
			absorbEnd: 7,
		});
	});
	it('absorbs a backtick pair fully contained inside the selection (contains-pair)', () => {
		// "등호(`=`)" — select the whole thing (chars 0..6)
		expect(detectBacktickContext('등호(`=`)', 0, 6)).toEqual({
			kind: 'absorb',
			absorbStart: 0,
			absorbEnd: 6,
		});
	});
	it('absorbs all overlapping pairs at once', () => {
		// "use `foo` here" — select the whole thing
		expect(detectBacktickContext('use `foo` here', 0, 14)).toEqual({
			kind: 'absorb',
			absorbStart: 0,
			absorbEnd: 14,
		});
	});
	it('returns "outside" when the closest preceding backtick is a CLOSING tick (between spans)', () => {
		// "use `foo` text 등호 more" — select "등호"
		const line = 'use `foo` text 등호 more';
		const start = line.indexOf('등호');
		const end = start + 2;
		expect(detectBacktickContext(line, start, end)).toEqual({ kind: 'outside' });
	});
	it('returns "outside" when selection sits between two unrelated code spans', () => {
		// "`a` 등호 `b`" — select "등호"
		const line = '`a` 등호 `b`';
		const start = line.indexOf('등호');
		const end = start + 2;
		expect(detectBacktickContext(line, start, end)).toEqual({ kind: 'outside' });
	});
	it('absorbs when the selection crosses a backtick pair boundary (only one tick inside selection)', () => {
		// "`isComplete`가 true인지 확인하고," — select "isComplete`가 true인지"
		const line = '`isComplete`가 true인지 확인하고,';
		const start = 1;
		const end = line.indexOf(' 확인');
		const result = detectBacktickContext(line, start, end);
		expect(result.kind).toBe('absorb');
		if (result.kind === 'absorb') {
			expect(result.absorbStart).toBe(0); // absorbed leading `
			expect(result.absorbEnd).toBe(end); // selection end is already past the trailing `
		}
	});
});
