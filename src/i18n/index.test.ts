import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	__setLocaleDictForTest,
	detectLocale,
	getLocale,
	setLocale,
	t,
} from './index';

// ---------------------------------------------------------------------------
// Test helpers — restore module state between cases. Locale is module-level
// global state, so we reset to 'en' after every test.
// ---------------------------------------------------------------------------
afterEach(() => {
	setLocale('en');
	// Drop any test-only locale dict injection so other tests start clean.
	__setLocaleDictForTest('__test_inject', null);
	vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Basic lookup — en/ko strings via dot-notation.
// ---------------------------------------------------------------------------
describe('t() — basic lookup', () => {
	it('returns the en string for a simple key when locale is "en"', () => {
		setLocale('en');
		expect(t('settings.colors.heading')).toBe('Highlight colors');
	});

	it('returns the ko string for the same key when locale is "ko"', () => {
		setLocale('ko');
		expect(t('settings.colors.heading')).toBe('강조 색상');
	});

	it('resolves nested dot-notation keys (3 levels deep)', () => {
		setLocale('en');
		expect(t('settings.colors.row.moveUp')).toBe('Move up');
		setLocale('ko');
		expect(t('settings.colors.row.moveUp')).toBe('위로 이동');
	});
});

// ---------------------------------------------------------------------------
// Param substitution — {placeholder} → params[placeholder].
// ---------------------------------------------------------------------------
describe('t() — param substitution', () => {
	it('substitutes {hotkey} into the en hotkey label', () => {
		setLocale('en');
		expect(t('settings.colors.row.hotkeyLabel', { hotkey: 'Ctrl+1' })).toBe(
			'Hotkey: Ctrl+1',
		);
	});

	it('substitutes {hotkey} into the ko hotkey label', () => {
		setLocale('ko');
		expect(t('settings.colors.row.hotkeyLabel', { hotkey: 'Ctrl+1' })).toBe(
			'단축키: Ctrl+1',
		);
	});

	it('coerces number params to strings', () => {
		setLocale('en');
		// Inject a test-only key to verify numeric coercion without polluting
		// the production locale dictionaries.
		__setLocaleDictForTest('__test_inject', {
			__test_only: { count: 'Count: {n}' },
		});
		setLocale('__test_inject');
		expect(t('__test_only.count', { n: 42 })).toBe('Count: 42');
	});
});

// ---------------------------------------------------------------------------
// Fallback behavior — missing key in current locale → en → raw key.
// ---------------------------------------------------------------------------
describe('t() — fallback resolution', () => {
	it('falls back to en when the key is missing in the current locale', () => {
		// Inject a partial ko-shaped dict that lacks our target key; en has it.
		__setLocaleDictForTest('__test_inject', {
			settings: { colors: { heading: '커스텀' } },
		});
		setLocale('__test_inject');
		// Present in injected dict → use injected value.
		expect(t('settings.colors.heading')).toBe('커스텀');
		// Missing in injected dict → fall through to en.
		expect(t('settings.colors.row.moveUp')).toBe('Move up');
	});

	it('returns the raw key when missing in both current locale and en', () => {
		setLocale('en');
		expect(t('no.such.key')).toBe('no.such.key');
		setLocale('ko');
		expect(t('no.such.key')).toBe('no.such.key');
	});

	it('returns the raw key when the path partially resolves to a non-string', () => {
		// `settings.colors` is an object — accessing it as a leaf key must not
		// return "[object Object]"; treat it as missing.
		setLocale('en');
		expect(t('settings.colors')).toBe('settings.colors');
	});
});

// ---------------------------------------------------------------------------
// detectLocale() — reads window.localStorage('language') with fallback.
// ---------------------------------------------------------------------------
describe('detectLocale()', () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns "ko" when localStorage.getItem("language") returns "ko"', () => {
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (k: string) => (k === 'language' ? 'ko' : null),
			},
		});
		expect(detectLocale()).toBe('ko');
	});

	it('returns "en" when localStorage.getItem returns null', () => {
		vi.stubGlobal('window', {
			localStorage: { getItem: () => null },
		});
		expect(detectLocale()).toBe('en');
	});

	it('returns "en" when window or localStorage is unavailable', () => {
		vi.stubGlobal('window', undefined);
		expect(detectLocale()).toBe('en');
	});

	it('returns "en" when localStorage access throws', () => {
		vi.stubGlobal('window', {
			get localStorage(): never {
				throw new Error('SecurityError');
			},
		});
		expect(detectLocale()).toBe('en');
	});
});

// ---------------------------------------------------------------------------
// setLocale / getLocale — locale switching round-trip.
// ---------------------------------------------------------------------------
describe('setLocale() / getLocale()', () => {
	it('switching ko → en → ko returns the matching translation each time', () => {
		setLocale('ko');
		expect(getLocale()).toBe('ko');
		expect(t('menu.highlight')).toBe('강조');

		setLocale('en');
		expect(getLocale()).toBe('en');
		expect(t('menu.highlight')).toBe('Highlight');

		setLocale('ko');
		expect(t('menu.highlight')).toBe('강조');
	});

	it('unknown locale strings fall back to en when looking up keys', () => {
		setLocale('xx-unknown');
		expect(getLocale()).toBe('xx-unknown');
		// No xx-unknown dict registered → goes straight to en.
		expect(t('menu.highlight')).toBe('Highlight');
	});
});
