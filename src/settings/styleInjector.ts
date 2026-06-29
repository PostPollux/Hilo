import type { HighlightStyle, Settings } from './data';

const STYLE_ID = 'od-highlight-colors';
const STYLE_BODY_PREFIX = 'od-style-';

export function applyHighlightColors(settings: Settings): void {
	let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement('style');
		el.id = STYLE_ID;
		document.head.appendChild(el);
	}
	el.textContent = settings.colors
		.map((c) => {
			const decl = `background-color: ${c.hex}; --od-underline: ${darkerUnderline(c.hex)};`;
			return `.hl-${c.slug}, mark.hl-${c.slug}, .cm-highlight.hl-${c.slug} { ${decl} }`;
		})
		.join('\n');
}

export function removeHighlightColors(): void {
	document.getElementById(STYLE_ID)?.remove();
}

export function applyHighlightStyle(style: HighlightStyle): void {
	removeHighlightStyle();
	if (style === 'default') return;
	document.body.classList.add(`${STYLE_BODY_PREFIX}${style}`);
}

export function removeHighlightStyle(): void {
	for (const cls of Array.from(document.body.classList)) {
		if (cls.startsWith(STYLE_BODY_PREFIX)) document.body.classList.remove(cls);
	}
}

// Lightness drop 30% + saturation 100% — matches iA Writer bg/underline pair (#FAECA0 → #FFD900).
export function darkerUnderline(hex: string): string {
	const norm = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
	const r = parseInt(norm.slice(1, 3), 16) / 255;
	const g = parseInt(norm.slice(3, 5), 16) / 255;
	const b = parseInt(norm.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0;
	if (max !== min) {
		const d = max - min;
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) h = ((b - r) / d + 2) / 6;
		else h = ((r - g) / d + 4) / 6;
	}
	const newL = Math.max(0, l - 0.3);
	return `hsl(${Math.round(h * 360)} 100% ${Math.round(newL * 100)}%)`;
}
