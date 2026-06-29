import { describe, it, expect } from 'vitest';
import { TOKEN_PREFIX_RE, parseColorPrefix, serializeColorPrefix, wrapHighlight } from './tokens';

describe('TOKEN_PREFIX_RE', () => {
	it('matches lowercase letter-start slug', () => {
		expect(TOKEN_PREFIX_RE.test('{yellow}')).toBe(true);
	});
	it('matches digit-start slug (1st, 2nd, 7th)', () => {
		expect(TOKEN_PREFIX_RE.test('{1st}')).toBe(true);
		expect(TOKEN_PREFIX_RE.test('{2nd}')).toBe(true);
		expect(TOKEN_PREFIX_RE.test('{7th}')).toBe(true);
	});
	it('matches slug with hyphens', () => {
		expect(TOKEN_PREFIX_RE.test('{soft-blue}')).toBe(true);
	});
	it('rejects uppercase start', () => {
		expect(TOKEN_PREFIX_RE.test('{Yellow}')).toBe(false);
	});
	it('rejects empty braces', () => {
		expect(TOKEN_PREFIX_RE.test('{}')).toBe(false);
	});
	it('rejects missing braces', () => {
		expect(TOKEN_PREFIX_RE.test('yellow')).toBe(false);
	});
});

describe('parseColorPrefix', () => {
	it('returns color + rest on match', () => {
		expect(parseColorPrefix('{yellow}hello')).toEqual({ color: 'yellow', rest: 'hello' });
	});
	it('handles digit-start slug', () => {
		expect(parseColorPrefix('{1st}foo')).toEqual({ color: '1st', rest: 'foo' });
	});
	it('returns null when no match', () => {
		expect(parseColorPrefix('hello')).toBeNull();
	});
	it('returns null on uppercase start', () => {
		expect(parseColorPrefix('{Yellow}hello')).toBeNull();
	});
	it('returns null on empty braces', () => {
		expect(parseColorPrefix('{}hello')).toBeNull();
	});
});

describe('serializeColorPrefix', () => {
	it('wraps color and content in braces', () => {
		expect(serializeColorPrefix('yellow', 'hello')).toBe('{yellow}hello');
	});
	it('handles digit-start slug', () => {
		expect(serializeColorPrefix('1st', 'sample')).toBe('{1st}sample');
	});
});

describe('wrapHighlight', () => {
	it('wraps with == markers', () => {
		expect(wrapHighlight('yellow', 'hello')).toBe('=={yellow}hello==');
	});
	it('preserves inline markdown inside content', () => {
		expect(wrapHighlight('red', '**bold** [[link]]')).toBe('=={red}**bold** [[link]]==');
	});
});

describe('roundtrip', () => {
	it('parse(serialize(c, t)) returns {c, t}', () => {
		const result = parseColorPrefix(serializeColorPrefix('yellow', 'hello'));
		expect(result).toEqual({ color: 'yellow', rest: 'hello' });
	});
	it('roundtrip with digit-start slug', () => {
		const result = parseColorPrefix(serializeColorPrefix('1st', 'first'));
		expect(result).toEqual({ color: '1st', rest: 'first' });
	});
});
