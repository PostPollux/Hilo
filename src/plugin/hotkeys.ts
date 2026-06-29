import type NativeHighlightPlugin from './main';

/** Command id used for the per-color wrap command (must match commands.ts). */
export function commandIdForColor(slug: string): string {
	return `wrap-${slug}`;
}

/** Lookup the human-readable hotkey assigned to a plugin command, or null if none.
 *  Uses the internal `app.hotkeyManager.printHotkeyForCommand` — wrapped in try/catch
 *  because the surface is undocumented and could disappear. */
export function getHotkeyForCommand(
	plugin: NativeHighlightPlugin,
	commandId: string,
): string | null {
	const fullId = `${plugin.manifest.id}:${commandId}`;
	try {
		// internal API: app.hotkeyManager.printHotkeyForCommand
		const mgr = (plugin.app as unknown as { hotkeyManager?: { printHotkeyForCommand?: (id: string) => string | undefined } }).hotkeyManager;
		const hk = mgr?.printHotkeyForCommand?.(fullId);
		return hk && hk.length > 0 ? hk : null;
	} catch {
		return null;
	}
}

/** Open the Hotkeys settings tab and pre-fill its search filter so a single command stays visible.
 *  Standard Hotkey Helper pattern — relies only on documented public navigation + the same internal
 *  surface (`tab.setQuery` / `tab.searchInputEl` / `tab.updateHotkeyVisibility`) that Obsidian itself
 *  uses for its built-in hotkey search. No DOM hacks. */
export function openHotkeyAssignment(
	plugin: NativeHighlightPlugin,
	displayName: string,
): void {
	try {
		// internal API: app.setting.open + openTabById
		const setting = (plugin.app as unknown as {
			setting?: {
				open: () => void;
				openTabById: (id: string) => void;
				activeTab?: HotkeySettingTab;
			};
		}).setting;
		if (!setting) return;
		setting.open();
		setting.openTabById('hotkeys');
		const tab = setting.activeTab;
		if (!tab) return;
		if (typeof tab.setQuery === 'function') {
			tab.setQuery(displayName);
			return;
		}
		const input = tab.searchInputEl ?? tab.searchComponent?.inputEl;
		if (input) {
			input.value = displayName;
			if (typeof tab.updateHotkeyVisibility === 'function') tab.updateHotkeyVisibility();
			else if (typeof tab.renderHotkeyList === 'function') tab.renderHotkeyList();
		}
	} catch {
		/* internal API best-effort */
	}
}

interface HotkeySettingTab {
	setQuery?: (q: string) => void;
	searchInputEl?: { value: string };
	searchComponent?: { inputEl: { value: string } };
	updateHotkeyVisibility?: () => void;
	renderHotkeyList?: () => void;
}
