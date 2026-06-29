import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, type Extension } from '@codemirror/state';

const HIGHLIGHT_RE = /==\{([a-z0-9][a-z0-9-]*)\}([^=\n]+(?:=[^=\n]+)*?)==/g;

function buildDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();

	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		HIGHLIGHT_RE.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = HIGHLIGHT_RE.exec(text)) !== null) {
			const color = match[1];
			const matchStart = from + match.index;
			const matchEnd = matchStart + match[0].length;
			const tokenStart = matchStart + 2;
			const tokenEnd = tokenStart + color.length + 2;

			// Paint the entire match (including `==` markers) so the active line shows
			// the highlight color on the markers instead of Obsidian's default yellow.
			builder.add(matchStart, matchEnd, Decoration.mark({ class: 'hl-' + color }));
			// Reveal the `{color}` token when the cursor touches it so the user can edit.
			const overlapsCursor = view.state.selection.ranges.some(
				r => r.to >= tokenStart && r.from <= tokenEnd,
			);
			if (!overlapsCursor) {
				builder.add(tokenStart, tokenEnd, Decoration.replace({}));
			}
		}
	}

	return builder.finish();
}

export const highlightLivePreviewExtension: Extension = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		constructor(view: EditorView) {
			this.decorations = buildDecorations(view);
		}
		update(u: ViewUpdate) {
			if (u.docChanged || u.viewportChanged || u.selectionSet) {
				this.decorations = buildDecorations(u.view);
			}
		}
	},
	{ decorations: v => v.decorations },
);
