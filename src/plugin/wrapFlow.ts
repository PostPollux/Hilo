import type { Editor } from 'obsidian';
import type NativeHighlightPlugin from './main';
import { detectBacktickContext, wrapWithColor } from './actions';
import { wrapHighlight } from '../parser/tokens';
import { ConfirmModal } from './modals';
import { t } from '../i18n';

/** Entry point for the "Highlight" action — handles inline-code (`` ` ``) context gracefully
 *  before delegating to `wrapWithColor` for the normal path. */
export function requestWrapWithColor(
	plugin: NativeHighlightPlugin,
	editor: Editor,
	color: string,
): void {
	const ranges = editor.listSelections();
	if (ranges.length !== 1) return wrapWithColor(editor, color);
	const sel = ranges[0];
	if (sel.anchor.line !== sel.head.line) return wrapWithColor(editor, color);
	const line = sel.anchor.line;
	const startCh = Math.min(sel.anchor.ch, sel.head.ch);
	const endCh = Math.max(sel.anchor.ch, sel.head.ch);
	if (startCh === endCh) return;

	const lineText = editor.getLine(line);
	const ctx = detectBacktickContext(lineText, startCh, endCh);

	if (ctx.kind === 'outside') {
		return wrapWithColor(editor, color);
	}

	// absorb: a backtick pair overlaps the selection. Ask before stripping the entire
	// absorbed region's backticks. After confirmation: keep the original prefix/suffix
	// of the absorbed region as plain text, and wrap only the selection.
	new ConfirmModal(
		plugin.app,
		{
			title: t('modal.backtick.title'),
			message: t('modal.backtick.message'),
			confirmLabel: t('modal.backtick.confirm'),
			cancelLabel: t('modal.backtick.cancel'),
		},
		() => {
			const stripTicks = (s: string) => s.replace(/`/g, '');
			const before = stripTicks(lineText.slice(ctx.absorbStart, startCh));
			const selected = stripTicks(lineText.slice(startCh, endCh));
			const after = stripTicks(lineText.slice(endCh, ctx.absorbEnd));
			const replacement = `${before}${wrapHighlight(color, selected)}${after}`;
			editor.replaceRange(
				replacement,
				{ line, ch: ctx.absorbStart },
				{ line, ch: ctx.absorbEnd },
			);
		},
	).open();
}
