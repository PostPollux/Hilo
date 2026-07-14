export interface HighlightColor {
	slug: string;
	hex: string;
	enabled: boolean;
}

export type HighlightStyle = 'default' | 'lowlight' | 'underlined';

export interface Settings {
	colors: HighlightColor[];
	style: HighlightStyle;
}

export const DEFAULT_SETTINGS: Settings = {
	colors: [
		{ slug: 'yellow', hex: '#fff3a3', enabled: true },
		{ slug: 'red', hex: '#ffb3b3', enabled: true },
		{ slug: 'green', hex: '#b3e6b3', enabled: true },
	],
	style: 'default',
};

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
