import { describe, it, expect, vi } from 'vitest';
import { getHotkeyForCommand, commandIdForColor, openHotkeyAssignment } from './hotkeys';
import type NativeHighlightPlugin from './main';

// ------------------------------------------------------------------
// Plugin mock — only the surface getHotkeyForCommand actually touches.
// ------------------------------------------------------------------
function createMockPlugin(opts: {
	manifestId?: string;
	hotkeys?: Record<string, string | undefined>;
	hotkeyManagerMissing?: boolean;
	throws?: boolean;
} = {}): NativeHighlightPlugin {
	const manifestId = opts.manifestId ?? 'od-highlight';
	const hotkeys = opts.hotkeys ?? {};
	const hotkeyManager = opts.hotkeyManagerMissing
		? undefined
		: {
				printHotkeyForCommand(id: string) {
					if (opts.throws) throw new Error('boom');
					return hotkeys[id];
				},
			};
	return {
		manifest: { id: manifestId },
		app: { hotkeyManager },
	} as unknown as NativeHighlightPlugin;
}

// ------------------------------------------------------------------
// commandIdForColor — slug → command id mapping (must match commands.ts)
// ------------------------------------------------------------------
describe('commandIdForColor', () => {
	it('builds "wrap-<slug>" for a simple letter slug', () => {
		expect(commandIdForColor('yellow')).toBe('wrap-yellow');
	});
	it('handles digit-start slugs (1st, 2nd, 7th)', () => {
		expect(commandIdForColor('1st')).toBe('wrap-1st');
		expect(commandIdForColor('7th')).toBe('wrap-7th');
	});
	it('handles hyphenated slugs', () => {
		expect(commandIdForColor('soft-blue')).toBe('wrap-soft-blue');
	});
});

// ------------------------------------------------------------------
// getHotkeyForCommand — internal API lookup with defensive guards
// ------------------------------------------------------------------
describe('getHotkeyForCommand', () => {
	it('returns the formatted hotkey string when assigned', () => {
		const plugin = createMockPlugin({
			hotkeys: { 'od-highlight:wrap-yellow': 'Ctrl+Shift+Y' },
		});
		expect(getHotkeyForCommand(plugin, 'wrap-yellow')).toBe('Ctrl+Shift+Y');
	});
	it('uses the current manifest id to build the full command id', () => {
		const plugin = createMockPlugin({
			manifestId: 'hilo',
			hotkeys: { 'hilo:wrap-red': 'Mod+Alt+R' },
		});
		expect(getHotkeyForCommand(plugin, 'wrap-red')).toBe('Mod+Alt+R');
	});
	it('returns null when no hotkey is assigned (undefined)', () => {
		const plugin = createMockPlugin({ hotkeys: {} });
		expect(getHotkeyForCommand(plugin, 'wrap-yellow')).toBeNull();
	});
	it('returns null when printHotkeyForCommand returns empty string', () => {
		const plugin = createMockPlugin({
			hotkeys: { 'od-highlight:wrap-yellow': '' },
		});
		expect(getHotkeyForCommand(plugin, 'wrap-yellow')).toBeNull();
	});
	it('returns null when hotkeyManager itself is missing (internal API gone)', () => {
		const plugin = createMockPlugin({ hotkeyManagerMissing: true });
		expect(getHotkeyForCommand(plugin, 'wrap-yellow')).toBeNull();
	});
	it('returns null when printHotkeyForCommand throws (defensive)', () => {
		const plugin = createMockPlugin({ throws: true });
		expect(getHotkeyForCommand(plugin, 'wrap-yellow')).toBeNull();
	});
});

// ------------------------------------------------------------------
// openHotkeyAssignment — open the Hotkeys tab and seed the search filter
// to narrow down to a single command (Hotkey Helper pattern).
// ------------------------------------------------------------------
describe('openHotkeyAssignment', () => {
	function createPluginWithSetting(tab?: Record<string, unknown>) {
		const open = vi.fn();
		const openTabById = vi.fn(() => {
			(setting as Record<string, unknown>).activeTab = tab;
		});
		const setting: Record<string, unknown> = { open, openTabById, activeTab: undefined };
		return {
			plugin: { manifest: { id: 'hilo', name: 'Hilo' }, app: { setting } } as unknown as NativeHighlightPlugin,
			open,
			openTabById,
		};
	}

	it('opens settings + navigates to the Hotkeys tab', () => {
		const { plugin, open, openTabById } = createPluginWithSetting({});
		openHotkeyAssignment(plugin, 'Hilo: Yellow');
		expect(open).toHaveBeenCalledOnce();
		expect(openTabById).toHaveBeenCalledWith('hotkeys');
	});
	it('uses setQuery() when the tab exposes it', () => {
		const setQuery = vi.fn();
		const { plugin } = createPluginWithSetting({ setQuery });
		openHotkeyAssignment(plugin, 'Hilo: Yellow');
		expect(setQuery).toHaveBeenCalledWith('Hilo: Yellow');
	});
	it('falls back to searchInputEl.value + updateHotkeyVisibility', () => {
		const inputEl = { value: '' };
		const updateHotkeyVisibility = vi.fn();
		const { plugin } = createPluginWithSetting({ searchInputEl: inputEl, updateHotkeyVisibility });
		openHotkeyAssignment(plugin, 'Hilo: Red');
		expect(inputEl.value).toBe('Hilo: Red');
		expect(updateHotkeyVisibility).toHaveBeenCalledOnce();
	});
	it('falls back further to searchComponent.inputEl + renderHotkeyList when present', () => {
		const inputEl = { value: '' };
		const renderHotkeyList = vi.fn();
		const { plugin } = createPluginWithSetting({
			searchComponent: { inputEl },
			renderHotkeyList,
		});
		openHotkeyAssignment(plugin, 'Hilo: Green');
		expect(inputEl.value).toBe('Hilo: Green');
		expect(renderHotkeyList).toHaveBeenCalledOnce();
	});
	it('is silent when app.setting itself is missing', () => {
		const plugin = { manifest: { id: 'hilo', name: 'Hilo' }, app: {} } as unknown as NativeHighlightPlugin;
		expect(() => openHotkeyAssignment(plugin, 'Hilo: Yellow')).not.toThrow();
	});
	it('is silent when openTabById throws (defensive)', () => {
		const setting = {
			open: vi.fn(),
			openTabById: vi.fn(() => {
				throw new Error('boom');
			}),
		};
		const plugin = { manifest: { id: 'hilo', name: 'Hilo' }, app: { setting } } as unknown as NativeHighlightPlugin;
		expect(() => openHotkeyAssignment(plugin, 'Hilo: Yellow')).not.toThrow();
	});
});
