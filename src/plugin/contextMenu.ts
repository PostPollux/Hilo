import type { Editor, MarkdownFileInfo, MarkdownView, Menu, MenuItem } from 'obsidian';
import type NativeHighlightPlugin from './main';
import { changeColor, findHighlightAt, selectionContainsHighlight, unhighlight, unhighlightSelection } from './actions';
import { requestWrapWithColor } from './wrapFlow';
import { t } from '../i18n';

// setSubmenu() is shipped by Obsidian but absent from the public d.ts (verified in obsidian.d.ts).
type MenuItemWithSubmenu = MenuItem & { setSubmenu: () => Menu };

export function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function populateMenu(
	menu: Menu,
	plugin: NativeHighlightPlugin,
	editor: Editor,
): boolean {
	const cursor = editor.getCursor('head');
	const active = findHighlightAt(editor, cursor.line, cursor.ch);
	const hasSelection = editor.somethingSelected();
	const activeColors = plugin.settings.colors.filter((c) => c.enabled).map((c) => c.slug);

	if (active && !hasSelection) {
		menu.addItem((item) => {
			item.setTitle(t('menu.changeColor')).setIcon('palette');
			const sub = (item as MenuItemWithSubmenu).setSubmenu();
			for (const c of activeColors) {
				if (c === active.color) continue;
				sub.addItem((si) =>
					si.setTitle(capitalize(c)).onClick(() => changeColor(editor, active, c)),
				);
			}
		});
		menu.addItem((item) =>
			item
				.setTitle(t('menu.unhighlight'))
				.setIcon('eraser')
				.onClick(() => unhighlight(editor, active)),
		);
		return true;
	}
	if (hasSelection) {
		menu.addItem((item) => {
			item.setTitle(t('menu.highlight')).setIcon('highlighter');
			const sub = (item as MenuItemWithSubmenu).setSubmenu();
			for (const c of activeColors) {
				sub.addItem((si) =>
					si.setTitle(capitalize(c)).onClick(() => requestWrapWithColor(plugin, editor, c)),
				);
			}
		});
		if (selectionContainsHighlight(editor)) {
			menu.addItem((item) =>
				item
					.setTitle(t('menu.unhighlight'))
					.setIcon('eraser')
					.onClick(() => unhighlightSelection(editor)),
			);
		}
		return true;
	}
	return false;
}

export function buildContextMenuHandler(plugin: NativeHighlightPlugin): (
	menu: Menu,
	editor: Editor,
	view: MarkdownView | MarkdownFileInfo,
) => void {
	return (menu, editor, _view) => {
		populateMenu(menu, plugin, editor);
	};
}
