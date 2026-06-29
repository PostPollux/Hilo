import type { Locale } from './types';

// English — default locale. All keys MUST be present here; ko.ts may fall back
// to this dictionary when a key is missing.
export const en: Locale = {
	settings: {
		colors: {
			heading: 'Highlight colors',
			desc: 'Manage colors used by the plugin. Disabled colors are hidden from the right-click menu but still rendered in notes.',
			addButton: 'Add color',
			row: {
				moveUp: 'Move up',
				moveDown: 'Move down',
				enabled: 'Enabled',
				slug: 'Slug',
				colorPicker: 'Color picker',
				hexValue: 'Hex value',
				hotkeyLabel: 'Hotkey: {hotkey}',
				hotkeyNone: 'No hotkey assigned',
				hotkeyConfigure: 'Configure hotkey',
				delete: 'Delete color',
			},
		},
		style: {
			heading: 'Highlight style',
			desc: 'Visual treatment applied to all highlights.',
			options: {
				default: 'Default (solid)',
				lowlight: 'Lowlight (iA Writer)',
			},
		},
	},
	menu: {
		highlight: 'Highlight',
		changeColor: 'Change color',
		unhighlight: 'Unhighlight',
	},
	commands: {
		openPalette: 'Open color palette',
		unhighlight: 'Unhighlight',
	},
	notice: {
		noSelectionOrHighlight: 'No selection or active highlight',
	},
	modal: {
		confirm: {
			defaultOk: 'OK',
			defaultCancel: 'Cancel',
		},
		backtick: {
			title: 'Inline code',
			message: 'The selection overlaps inline code (`). Remove the backticks and apply highlight?',
			confirm: 'Remove backticks & highlight',
			cancel: 'Cancel',
		},
	},
};
