import { Plugin } from 'obsidian';
import { colorMarkPostProcessor } from '../parser/readingView';
import { highlightLivePreviewExtension } from '../parser/livePreview';
import { buildContextMenuHandler } from './contextMenu';
import { registerColorCommands, registerOpenPaletteCommand, registerUnhighlightCommand } from './commands';
import { DEFAULT_SETTINGS, type Settings } from '../settings/data';
import { applyHighlightColors, applyHighlightStyle, removeHighlightColors, removeHighlightStyle } from '../settings/styleInjector';
import { HighlightSettingTab } from '../settings/tab';
import { detectLocale, setLocale } from '../i18n';

export default class NativeHighlightPlugin extends Plugin {
  settings!: Settings;
  registeredColorCommandIds: string[] = [];

  async onload() {
    setLocale(detectLocale());
    await this.loadSettings();
    applyHighlightColors(this.settings);
    applyHighlightStyle(this.settings.style);
    this.registerMarkdownPostProcessor(colorMarkPostProcessor);
    this.registerEditorExtension(highlightLivePreviewExtension);
    this.registerEvent(this.app.workspace.on('editor-menu', buildContextMenuHandler(this)));
    this.addSettingTab(new HighlightSettingTab(this.app, this));
    registerOpenPaletteCommand(this);
    registerUnhighlightCommand(this);
    registerColorCommands(this);
  }

  onunload() {
    removeHighlightColors();
    removeHighlightStyle();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    applyHighlightColors(this.settings);
    applyHighlightStyle(this.settings.style);
    registerColorCommands(this);
  }
}
