class App {
    constructor() {
        this.dom = {
            root: document.documentElement,
            mainCard: document.querySelector('.card'),
            themeSwitcher: document.getElementById('theme-switcher'),
            mainTabs: document.getElementById('main-tabs'),
            tabPanelsContainer: document.querySelector('.tab-panels'),
            openTgModalBtn: document.getElementById('open-tg-modal-btn'),
            exclusiveTabBtn: document.getElementById('tab-exclusive'),
            backgroundAnimation: document.getElementById('background-animation'),
            // New Modal Elements
            modalBackdrop: document.getElementById('modal-backdrop'),
            modalContainer: document.getElementById('modal-container'),
            modalTitle: document.getElementById('modal-title'),
            modalContent: document.getElementById('modal-content'),
            modalActions: document.getElementById('modal-actions'),
        };

        this.state = {
            isThemeSwitching: false,
            ageGateConfirmed: false,
            activePanel: null,
            isModalOpen: false,
            currentModalView: null,
        };

        this.constants = {
            COPY_SUCCESS_DURATION: 2000,
            RESIZE_DEBOUNCE_DELAY: 150,
            TABS_ANIMATION_DURATION: 400,
            MODAL_ANIMATION_DURATION: 250, // Single duration for modal animations
        };

        this.init();
    }

    init() {
        this.initTheme();
        this.loadPersistentState();
        this.initEventListeners();
        this.initTabs();
        this.initBackgroundAnimation();
        this.initModalViews();
    }

    loadPersistentState() {
        this.state.ageGateConfirmed = localStorage.getItem('ageGateConfirmed') === 'true';
    }

    static debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    initBackgroundAnimation() {
        if (!this.dom.backgroundAnimation || this.dom.backgroundAnimation.children.length > 0) return;
        const numShapes = 15;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < numShapes; i++) {
            const shape = document.createElement('span');
            shape.className = 'shape';
            const size = Math.random() * 40 + 10;
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
            shape.style.left = `${Math.random() * 100}%`;
            shape.style.animationDuration = `${Math.random() * 15 + 10}s`;
            shape.style.animationDelay = `${Math.random() * 5}s`;
            fragment.appendChild(shape);
        }
        this.dom.backgroundAnimation.appendChild(fragment);
    }

    initTheme() {
        if (!this.dom.themeSwitcher) return;
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        this.dom.root.classList.toggle('dark-theme', isDark);
        this.dom.themeSwitcher.selected = isDark;
    }

    initEventListeners() {
        this.dom.themeSwitcher?.addEventListener('click', () => this.toggleTheme());
        this.dom.mainTabs?.addEventListener('change', (e) => this.handleTabChange(e));
        window.addEventListener('resize', App.debounce(() => this.updatePanelsHeight(), this.constants.RESIZE_DEBOUNCE_DELAY));

        // Modal related listeners
        this.dom.openTgModalBtn?.addEventListener('click', () => this.openModal('channel-select'));
        this.dom.modalContainer?.addEventListener('click', (e) => this.handleModalAction(e));
        this.dom.modalBackdrop?.addEventListener('click', () => this.closeModal());

        document.addEventListener('click', (e) => {
            const copyButton = e.target.closest('[data-clipboard-text]');
            if (copyButton) this.handleCopyClick(copyButton);
        });
    }

    toggleTheme() {
        if (this.state.isThemeSwitching) return;
        this.state.isThemeSwitching = true;
        const isDark = this.dom.root.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTimeout(() => (this.state.isThemeSwitching = false), this.constants.TABS_ANIMATION_DURATION);
    }

    async handleCopyClick(button) {
        if (button.disabled) return;
        const textToCopy = button.dataset.clipboardText;
        const originalContent = button.innerHTML;
        try {
            await navigator.clipboard.writeText(textToCopy);
            button.disabled = true;
            button.classList.add('copied');
            button.innerHTML = `<md-icon slot="icon">check_circle</md-icon> Скопировано!`;
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('copied');
                button.innerHTML = originalContent;
            }, this.constants.COPY_SUCCESS_DURATION);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    initTabs() {
        if (!this.dom.mainTabs) return;
        this.dom.exclusiveTabBtn?.addEventListener('click', (e) => this.handleExclusiveTabClick(e), true);
        this.setupInitialTabState();
    }

    handleExclusiveTabClick(e) {
        if (!this.state.ageGateConfirmed) {
            e.preventDefault();
            e.stopImmediatePropagation();
            this.openModal('age-gate');
        }
    }

    handleTabChange(e) {
        if (e.target.activeTab) this.switchTab(e.target.activeTab);
    }

    setupInitialTabState() {
        this.dom.tabPanelsContainer.querySelectorAll('.tab-panel').forEach(p => {
            p.hidden = true;
            p.classList.remove('is-active');
        });
        const initialActiveTab = this.dom.mainTabs.activeTab;
        if (!initialActiveTab) return;
        const panelId = initialActiveTab.getAttribute('aria-controls');
        const initialPanel = this.dom.tabPanelsContainer.querySelector(`#${panelId}`);
        if (initialPanel) {
            initialPanel.hidden = false;
            initialPanel.classList.add('is-active');
            this.state.activePanel = initialPanel;
            this.updatePanelsHeight();
        }
    }

    switchTab(newTab) {
        const newPanelId = newTab.getAttribute('aria-controls');
        const newPanel = this.dom.tabPanelsContainer.querySelector(`#${newPanelId}`);
        if (!newPanel || newPanel === this.state.activePanel) return;

        const oldPanel = this.state.activePanel;

        if (oldPanel) {
            oldPanel.classList.remove('is-active');
            setTimeout(() => {
                if (this.state.activePanel !== oldPanel) oldPanel.hidden = true;
            }, this.constants.TABS_ANIMATION_DURATION);
        }

        newPanel.hidden = false;
        this.state.activePanel = newPanel;
        this.updatePanelsHeight();

        if (this.dom.mainTabs.getBoundingClientRect().top < 0) {
            this.dom.mainTabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updatePanelsHeight() {
        if (!this.dom.tabPanelsContainer || !this.state.activePanel) return;
        requestAnimationFrame(() => {
            const panelHeight = this.state.activePanel.scrollHeight;
            this.dom.tabPanelsContainer.style.height = `${panelHeight}px`;
            this.state.activePanel.classList.add('is-active');
        });
    }

    // --- NEW MODAL LOGIC --- //

    initModalViews() {
        this.modalViews = {
            'channel-select': {
                title: 'Выберите канал',
                content: () => `
                    <div class="links-grid">
                        <md-filled-button href="https://t.me/JesusArtt" target="_blank" rel="noopener noreferrer">
                            <md-icon slot="icon">palette</md-icon> Основной
                        </md-filled-button>
                        <md-filled-button href="https://t.me/+i1Mw5vUIu5RlZmE6" target="_blank" rel="noopener noreferrer">
                            <md-icon slot="icon">forum</md-icon> Щитпост
                        </md-filled-button>
                        <md-filled-tonal-button data-action="show-age-gate">
                            <md-icon slot="icon">18_up_rating</md-icon> Хорни
                        </md-filled-tonal-button>
                    </div>`,
                actions: () => `<md-text-button data-action="close">Закрыть</md-text-button>`
            },
            'age-gate': {
                title: 'Подтверждение возраста',
                content: () => `
                    <p>Этот раздел содержит материалы, предназначенные исключительно для совершеннолетних (18+).</p>
                    <p>Нажимая "Продолжить", вы подтверждаете, что вам исполнилось 18 лет и вы осознаете характер контента.</p>`,
                actions: (source) => `
                    <md-text-button data-action="back">${source === 'exclusive-tab' ? 'Закрыть' : 'Назад'}</md-text-button>
                    <md-filled-button data-action="confirm-age" autofocus>Продолжить</md-filled-button>`
            }
        };
    }

    handleModalAction(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;

        switch (action) {
            case 'close':
                this.closeModal();
                break;
            case 'show-age-gate':
                if (this.state.ageGateConfirmed) {
                    this.closeModal(() => {
                        setTimeout(() => this.dom.exclusiveTabBtn.click(), 50);
                    });
                } else {
                    this.updateModal('age-gate');
                }
                break;
            case 'back':
                if (this.state.modalSource === 'exclusive-tab') {
                    this.closeModal();
                } else {
                    this.updateModal('channel-select');
                }
                break;
            case 'confirm-age':
                this.state.ageGateConfirmed = true;
                localStorage.setItem('ageGateConfirmed', 'true');
                this.closeModal(() => {
                    // Use a timeout to ensure the tab click happens after the modal is gone
                    setTimeout(() => this.dom.exclusiveTabBtn.click(), 50);
                });
                break;
        }
    }

    openModal(viewName) {
        if (this.state.isModalOpen) return;
        this.state.isModalOpen = true;
        this.state.modalSource = viewName === 'age-gate' ? 'exclusive-tab' : 'telegram-btn';

        this.dom.modalBackdrop.hidden = false;
        this.dom.modalContainer.hidden = false;

        document.body.style.overflow = 'hidden';
        this.dom.mainCard.classList.add('blurred');

        requestAnimationFrame(() => {
            this.dom.modalBackdrop.classList.add('is-visible');
            this.dom.modalContainer.classList.add('is-visible');
            this.updateModal(viewName, false);
        });
    }

    closeModal(callback) {
        if (!this.state.isModalOpen) return;
        this.state.isModalOpen = false;

        this.dom.modalBackdrop.classList.remove('is-visible');
        this.dom.modalContainer.classList.remove('is-visible');

        this.dom.mainCard.classList.remove('blurred');
        document.body.style.overflow = '';

        setTimeout(() => {
            this.dom.modalBackdrop.hidden = true;
            this.dom.modalContainer.hidden = true;
            this.dom.modalContent.innerHTML = ''; // Clear content after hiding
            if (typeof callback === 'function') {
                callback();
            }
        }, this.constants.MODAL_ANIMATION_DURATION);
    }

    async updateModal(viewName, animate = true) {
        const view = this.modalViews[viewName];
        if (!view) return;

        this.state.currentModalView = viewName;
        const oldContent = this.dom.modalContent.querySelector('.modal-view');

        if (oldContent && animate) {
            oldContent.classList.add('is-hiding');
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        this.dom.modalTitle.textContent = view.title;
        this.dom.modalContent.innerHTML = `<div class="modal-view">${view.content(this.state.modalSource)}</div>`;
        this.dom.modalActions.innerHTML = view.actions(this.state.modalSource);

        const newContent = this.dom.modalContent.querySelector('.modal-view');

        // Wait for new web components to be ready
        const components = this.dom.modalContainer.querySelectorAll('md-filled-button, md-filled-tonal-button, md-text-button');
        await Promise.all(Array.from(components).map(c => c.updateComplete));

        requestAnimationFrame(() => {
            const newHeight = newContent.scrollHeight;
            this.dom.modalContent.style.height = `${newHeight}px`;
            newContent.classList.add('is-active');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new App());
