import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import type NativeHighlightPlugin from '../plugin/main';
import { HEX_RE, SLUG_RE, type HighlightColor, type HighlightStyle } from './data';
import { applyHighlightColors } from './styleInjector';
import { commandIdForColor, getHotkeyForCommand, openHotkeyAssignment } from '../plugin/hotkeys';
import { capitalize } from '../plugin/contextMenu';
import { t } from '../i18n';

export class HighlightSettingTab extends PluginSettingTab {
	plugin: NativeHighlightPlugin;

	constructor(app: App, plugin: NativeHighlightPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settings.colors.heading'))
			.setDesc(t('settings.colors.desc'))
			.setHeading();

		new Setting(containerEl).addButton((btn) =>
			btn.setButtonText(t('settings.colors.addButton')).onClick(async () => {
				this.plugin.settings.colors.push({ slug: 'new', hex: '#cccccc', enabled: true });
				await this.plugin.saveSettings();
				applyHighlightColors(this.plugin.settings);
				this.display();
			}),
		);

		this.plugin.settings.colors.forEach((color, i) => this.renderRow(containerEl, color, i));

		new Setting(containerEl)
			.setName(t('settings.style.heading'))
			.setDesc(t('settings.style.desc'))
			.addDropdown((dd) => {
				dd.addOption('default', t('settings.style.options.default'));
				dd.addOption('lowlight', t('settings.style.options.lowlight'));
				dd.setValue(this.plugin.settings.style);
				dd.onChange(async (value) => {
					this.plugin.settings.style = value as HighlightStyle;
					await this.plugin.saveSettings();
				});
			});
	}

	private renderRow(containerEl: HTMLElement, color: HighlightColor, index: number): void {
		const colors = this.plugin.settings.colors;
		const row = containerEl.createDiv({ cls: 'od-color-row' });

		const upBtn = row.createEl('button', { cls: 'od-arrow', attr: { 'aria-label': t('settings.colors.row.moveUp') } });
		setIcon(upBtn, 'chevron-up');
		upBtn.disabled = index === 0;
		upBtn.addEventListener('click', async () => {
			if (index === 0) return;
			[colors[index - 1], colors[index]] = [colors[index], colors[index - 1]];
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
			this.display();
		});

		const downBtn = row.createEl('button', {
			cls: 'od-arrow',
			attr: { 'aria-label': t('settings.colors.row.moveDown') },
		});
		setIcon(downBtn, 'chevron-down');
		downBtn.disabled = index === colors.length - 1;
		downBtn.addEventListener('click', async () => {
			if (index === colors.length - 1) return;
			[colors[index], colors[index + 1]] = [colors[index + 1], colors[index]];
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
			this.display();
		});

		const enabledInput = row.createEl('input', {
			cls: 'od-enabled-toggle',
			attr: { type: 'checkbox', 'aria-label': t('settings.colors.row.enabled') },
		});
		enabledInput.checked = color.enabled;
		enabledInput.addEventListener('change', async () => {
			colors[index].enabled = enabledInput.checked;
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
		});

		const slugInput = row.createEl('input', {
			cls: 'od-slug-input',
			attr: { type: 'text', value: color.slug, 'aria-label': t('settings.colors.row.slug') },
		});
		slugInput.value = color.slug;
		slugInput.addEventListener('input', async () => {
			const next = slugInput.value;
			const duplicate = colors.some((c, j) => j !== index && c.slug === next);
			if (!SLUG_RE.test(next) || duplicate) {
				slugInput.classList.add('is-invalid');
				return;
			}
			slugInput.classList.remove('is-invalid');
			colors[index].slug = next;
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
		});

		const picker = row.createEl('input', {
			cls: 'od-color-picker',
			attr: { type: 'color', 'aria-label': t('settings.colors.row.colorPicker') },
		});
		picker.value = normalizeHexForPicker(color.hex);

		const hexInput = row.createEl('input', {
			cls: 'od-hex-input',
			attr: { type: 'text', 'aria-label': t('settings.colors.row.hexValue') },
		});
		hexInput.value = color.hex;

		picker.addEventListener('input', async () => {
			const next = picker.value;
			hexInput.value = next;
			hexInput.classList.remove('is-invalid');
			colors[index].hex = next;
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
		});

		hexInput.addEventListener('input', async () => {
			const next = hexInput.value;
			if (!HEX_RE.test(next)) {
				hexInput.classList.add('is-invalid');
				return;
			}
			hexInput.classList.remove('is-invalid');
			picker.value = normalizeHexForPicker(next);
			colors[index].hex = next;
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
		});

		const hotkey = getHotkeyForCommand(this.plugin, commandIdForColor(color.slug));
		const hotkeyLabel = hotkey
			? t('settings.colors.row.hotkeyLabel', { hotkey })
			: t('settings.colors.row.hotkeyNone');
		const hotkeyChip = row.createSpan({
			cls: hotkey ? 'od-hotkey' : 'od-hotkey od-hotkey-empty',
			text: hotkey ?? '—',
			attr: { 'aria-label': hotkeyLabel },
		});
		hotkeyChip.title = hotkeyLabel;

		const hotkeyBtn = row.createEl('button', {
			cls: 'od-hotkey-button',
			attr: { 'aria-label': t('settings.colors.row.hotkeyConfigure') },
		});
		setIcon(hotkeyBtn, 'keyboard');
		hotkeyBtn.addEventListener('click', () => {
			openHotkeyAssignment(this.plugin, `${this.plugin.manifest.name}: ${capitalize(color.slug)}`);
		});

		const deleteBtn = row.createEl('button', {
			cls: 'od-delete',
			attr: { 'aria-label': t('settings.colors.row.delete') },
		});
		setIcon(deleteBtn, 'trash');
		deleteBtn.addEventListener('click', async () => {
			colors.splice(index, 1);
			await this.plugin.saveSettings();
			applyHighlightColors(this.plugin.settings);
			this.display();
		});
	}
}

// <input type="color"> only accepts 7-char #rrggbb; expand #rgb shorthand.
function normalizeHexForPicker(hex: string): string {
	if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
		const r = hex[1];
		const g = hex[2];
		const b = hex[3];
		return `#${r}${r}${g}${g}${b}${b}`;
	}
	return hex;
}
