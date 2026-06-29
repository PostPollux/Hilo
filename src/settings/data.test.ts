import { describe, it, expect } from 'vitest';
import { SLUG_RE, HEX_RE, DEFAULT_SETTINGS } from './data';

describe('SLUG_RE', () => {
	it('accepts lowercase letter slug', () => {
		expect(SLUG_RE.test('yellow')).toBe(true);
	});
	it('accepts digit-start slug (1st, 2nd, 7th)', () => {
		expect(SLUG_RE.test('1st')).toBe(true);
		expect(SLUG_RE.test('2nd')).toBe(true);
		expect(SLUG_RE.test('7th')).toBe(true);
	});
	it('accepts hyphenated slug', () => {
		expect(SLUG_RE.test('soft-blue')).toBe(true);
	});
	it('rejects uppercase', () => {
		expect(SLUG_RE.test('Yellow')).toBe(false);
	});
	it('rejects empty', () => {
		expect(SLUG_RE.test('')).toBe(false);
	});
	it('rejects whitespace', () => {
		expect(SLUG_RE.test('yellow blue')).toBe(false);
	});
	it('rejects special characters', () => {
		expect(SLUG_RE.test('yellow!')).toBe(false);
		expect(SLUG_RE.test('yellow_blue')).toBe(false);
	});
});

describe('HEX_RE', () => {
	it('accepts 6-digit hex (lowercase)', () => {
		expect(HEX_RE.test('#fff3a3')).toBe(true);
	});
	it('accepts 6-digit hex (uppercase)', () => {
		expect(HEX_RE.test('#FFB3B3')).toBe(true);
	});
	it('accepts 3-digit hex', () => {
		expect(HEX_RE.test('#fff')).toBe(true);
		expect(HEX_RE.test('#000')).toBe(true);
	});
	it('rejects missing #', () => {
		expect(HEX_RE.test('fff3a3')).toBe(false);
	});
	it('rejects 4-digit (no shorthand alpha)', () => {
		expect(HEX_RE.test('#fffa')).toBe(false);
	});
	it('rejects invalid characters', () => {
		expect(HEX_RE.test('#zzz')).toBe(false);
	});
	it('rejects empty', () => {
		expect(HEX_RE.test('')).toBe(false);
		expect(HEX_RE.test('#')).toBe(false);
	});
});

describe('DEFAULT_SETTINGS', () => {
	it('has 3 default colors', () => {
		expect(DEFAULT_SETTINGS.colors).toHaveLength(3);
	});
	it('uses default style', () => {
		expect(DEFAULT_SETTINGS.style).toBe('default');
	});
	it('all default colors are enabled', () => {
		expect(DEFAULT_SETTINGS.colors.every((c) => c.enabled)).toBe(true);
	});
	it('all default slugs pass SLUG_RE', () => {
		expect(DEFAULT_SETTINGS.colors.every((c) => SLUG_RE.test(c.slug))).toBe(true);
	});
	it('all default hex values pass HEX_RE', () => {
		expect(DEFAULT_SETTINGS.colors.every((c) => HEX_RE.test(c.hex))).toBe(true);
	});
	it('contains yellow, red, green', () => {
		const slugs = DEFAULT_SETTINGS.colors.map((c) => c.slug);
		expect(slugs).toEqual(['yellow', 'red', 'green']);
	});
});
