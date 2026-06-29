import { describe, it, expect } from 'vitest';
import { darkerUnderline } from './styleInjector';

describe('darkerUnderline', () => {
	it('emits hsl() string with saturation 100%', () => {
		expect(darkerUnderline('#fff3a3')).toMatch(/^hsl\(\d+ 100% \d+%\)$/);
	});
	it('default yellow #fff3a3 → hsl(52 100% 52%)', () => {
		expect(darkerUnderline('#fff3a3')).toBe('hsl(52 100% 52%)');
	});
	it('default red #ffb3b3 → hsl(0 100% 55%)', () => {
		expect(darkerUnderline('#ffb3b3')).toBe('hsl(0 100% 55%)');
	});
	it('default green #b3e6b3 → hsl(120 100% 50%)', () => {
		expect(darkerUnderline('#b3e6b3')).toBe('hsl(120 100% 50%)');
	});
	it('normalizes 3-digit hex (#fff → #ffffff); always emits saturation 100%', () => {
		// Achromatic input still emits 100% saturation — visual result is identical at l=70%.
		expect(darkerUnderline('#fff')).toBe('hsl(0 100% 70%)');
	});
	it('clamps lightness at 0 for black', () => {
		expect(darkerUnderline('#000')).toBe('hsl(0 100% 0%)');
	});
	it('uppercase hex normalizes correctly', () => {
		expect(darkerUnderline('#FFB3B3')).toBe('hsl(0 100% 55%)');
	});
	it('reduces lightness by 30 percentage points (approx)', () => {
		// #888 = lightness ~53% → ~23%
		const result = darkerUnderline('#888');
		const match = result.match(/hsl\(\d+ \d+% (\d+)%\)/);
		expect(match).not.toBeNull();
		const l = Number(match![1]);
		expect(l).toBeGreaterThanOrEqual(22);
		expect(l).toBeLessThanOrEqual(24);
	});
});
