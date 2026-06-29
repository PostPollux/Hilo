import { App, Modal } from 'obsidian';
import { t } from '../i18n';

export class ConfirmModal extends Modal {
	private onConfirm: () => void;
	private titleText: string;
	private message: string;
	private confirmLabel: string;
	private cancelLabel: string;

	constructor(
		app: App,
		opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string },
		onConfirm: () => void,
	) {
		super(app);
		this.titleText = opts.title;
		this.message = opts.message;
		this.confirmLabel = opts.confirmLabel ?? t('modal.confirm.defaultOk');
		this.cancelLabel = opts.cancelLabel ?? t('modal.confirm.defaultCancel');
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h3', { text: this.titleText });
		contentEl.createEl('p', { text: this.message });
		const btnContainer = contentEl.createDiv({ cls: 'modal-button-container' });
		const confirmBtn = btnContainer.createEl('button', {
			text: this.confirmLabel,
			cls: 'mod-cta',
		});
		confirmBtn.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});
		const cancelBtn = btnContainer.createEl('button', { text: this.cancelLabel });
		cancelBtn.addEventListener('click', () => this.close());
	}

	onClose() {
		this.contentEl.empty();
	}
}
