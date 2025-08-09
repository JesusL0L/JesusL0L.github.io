import { AppState } from './appState.js';
import { DOM } from './dom.js';
import { CONSTANTS } from './constants.js';

export const ModalManager = {
    modalViews: {
        'channel-select': {
            title: 'Выберите канал',
            contentTemplate: document.getElementById('modal-template-channel-select'),
            actions: () => `<md-text-button data-action="close">Закрыть</md-text-button>`
        },
        'age-gate': {
            title: 'Подтверждение возраста',
            contentTemplate: document.getElementById('modal-template-age-gate'),
            actions: (source) => `
                <md-text-button data-action="back">${source === 'exclusive-tab' ? 'Закрыть' : 'Назад'}</md-text-button>
                <md-filled-button data-action="confirm-age" autofocus>Продолжить</md-filled-button>`
        }
    },

    init() {
        DOM.openTgModalBtn?.addEventListener('click', () => this.openModal('channel-select'));
        DOM.modalContainer?.addEventListener('click', (e) => this.handleModalAction(e));
        DOM.modalBackdrop?.addEventListener('click', () => this.closeModal());
    },

    handleModalAction(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        const action = button.dataset.action;

        switch (action) {
            case 'close':
                this.closeModal();
                break;
            case 'show-age-gate':
                if (AppState.ageGateConfirmed) {
                    this.closeModal(() => setTimeout(() => DOM.exclusiveTabBtn.click(), 50));
                } else {
                    this.updateModal('age-gate');
                }
                break;
            case 'back':
                AppState.modalSource === 'exclusive-tab' ? this.closeModal() : this.updateModal('channel-select');
                break;
            case 'confirm-age':
                AppState.ageGateConfirmed = true;
                localStorage.setItem('ageGateConfirmed', 'true');
                this.closeModal(() => setTimeout(() => DOM.exclusiveTabBtn.click(), 50));
                break;
        }
    },

    openModal(viewName) {
        if (AppState.isModalOpen) return;
        AppState.isModalOpen = true;
        AppState.modalSource = viewName === 'age-gate' ? 'exclusive-tab' : 'telegram-btn';

        DOM.body.style.overflow = 'hidden';
        DOM.mainCard.classList.add('blurred');

        requestAnimationFrame(() => {
            DOM.modalBackdrop.classList.add('is-visible');
            DOM.modalContainer.classList.add('is-visible');
            this.updateModal(viewName, false);
        });
    },

    closeModal(callback) {
        if (!AppState.isModalOpen) return;
        AppState.isModalOpen = false;

        DOM.modalBackdrop.classList.remove('is-visible');
        DOM.modalContainer.classList.remove('is-visible');
        DOM.mainCard.classList.remove('blurred');

        setTimeout(() => {
            DOM.body.style.overflow = '';
            DOM.modalContent.innerHTML = '';
            if (typeof callback === 'function') callback();
        }, CONSTANTS.MODAL_ANIMATION_DURATION);
    },

    async updateModal(viewName, animate = true) {
        const view = this.modalViews[viewName];
        if (!view) return;

        const oldContent = DOM.modalContent.querySelector('.modal-view');
        if (oldContent && animate) {
            oldContent.classList.add('is-hiding');
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        DOM.modalTitle.textContent = view.title;
        const newContentNode = view.contentTemplate.content.cloneNode(true);
        DOM.modalContent.innerHTML = '<div class="modal-view"></div>';
        DOM.modalContent.querySelector('.modal-view').appendChild(newContentNode);
        DOM.modalActions.innerHTML = view.actions(AppState.modalSource);

        const newContent = DOM.modalContent.querySelector('.modal-view');
        const components = DOM.modalContainer.querySelectorAll('md-filled-button, md-filled-tonal-button, md-text-button');
        await Promise.all(Array.from(components).map(c => c.updateComplete));

        requestAnimationFrame(() => {
            newContent.classList.add('is-active');
            DOM.modalContent.style.height = `${newContent.scrollHeight}px`;
        });
    }
};
