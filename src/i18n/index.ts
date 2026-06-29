// ---------------------------------------------------------------------------
// Lightweight i18n core for the Hilo plugin.
//
// - Locale dictionaries are imported statically (en, ko). No async loader.
// - `t('a.b.c', { name: 'X' })` resolves a dot-notation path against the
//   current-locale dict, then falls back to en, then returns the raw key.
// - `{placeholder}` segments inside the resolved string are replaced with
//   `String(params.placeholder)`.
// - No `obsidian` import on purpose so this is testable under plain node /
//   vitest without a DOM.
// ---------------------------------------------------------------------------

import { en } from './locales/en';
import { ko } from './locales/ko';
import type { Locale } from './locales/types';

// A locale dict can be a partial of the canonical Locale shape — useful for
// translations that are not 100% complete (we fall back per-key to en).
type LocaleDict = Partial<Locale> | Record<string, unknown>;

// Registry of available locale dictionaries. `en` MUST be present as the
// ultimate fallback; other locales are optional.
const dictionaries: Record<string, LocaleDict> = {
	en,
	ko,
};

let currentLocale = 'en';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function setLocale(lang: string): void {
	currentLocale = lang;
}

export function getLocale(): string {
	return currentLocale;
}

/**
 * Look up `key` (dot-notation) in the current locale, falling back to en, and
 * finally returning the raw key when nothing matches. Substitutes `{name}`
 * placeholders with values from `params`.
 */
export function t(key: string, params?: Record<string, string | number>): string {
	const fromCurrent = lookup(dictionaries[currentLocale], key);
	const resolved = fromCurrent ?? lookup(dictionaries.en, key) ?? key;
	return params ? substitute(resolved, params) : resolved;
}

/**
 * Read the Obsidian-managed UI language from `window.localStorage`.
 * Returns `'en'` when the key is unset, the storage API is unavailable, or
 * access throws (e.g. SecurityError in sandboxed contexts).
 */
export function detectLocale(): string {
	try {
		const w: unknown = typeof window !== 'undefined' ? window : undefined;
		if (!w) return 'en';
		const ls = (w as { localStorage?: { getItem(k: string): string | null } }).localStorage;
		if (!ls || typeof ls.getItem !== 'function') return 'en';
		const lang = ls.getItem('language');
		return lang && lang.length > 0 ? lang : 'en';
	} catch {
		return 'en';
	}
}

// ---------------------------------------------------------------------------
// Test-only seam — register / remove a custom dictionary by name. Kept here
// (with a deliberately-ugly `__` prefix) so tests can verify fallback paths
// without polluting the real en/ko dictionaries. Pass `null` to remove.
// ---------------------------------------------------------------------------
export function __setLocaleDictForTest(name: string, dict: LocaleDict | null): void {
	if (dict === null) {
		delete dictionaries[name];
	} else {
		dictionaries[name] = dict;
	}
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function lookup(dict: LocaleDict | undefined, key: string): string | null {
	if (!dict) return null;
	const parts = key.split('.');
	let cursor: unknown = dict;
	for (const part of parts) {
		if (cursor && typeof cursor === 'object' && part in (cursor as Record<string, unknown>)) {
			cursor = (cursor as Record<string, unknown>)[part];
		} else {
			return null;
		}
	}
	return typeof cursor === 'string' ? cursor : null;
}

function substitute(template: string, params: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, name: string) => {
		const value = params[name];
		return value === undefined ? match : String(value);
	});
}
