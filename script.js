const AppState = {
    isThemeSwitching: false,
    ageGateConfirmed: localStorage.getItem('ageGateConfirmed') === 'true',
    activePanel: null,
    isModalOpen: false,
    modalSource: null,
};

const DOM = {
    root: document.documentElement,
    body: document.body,
    mainCard: document.querySelector('.card'),
    themeSwitcher: document.getElementById('theme-switcher'),
    mainTabs: document.getElementById('main-tabs'),
    tabPanelsContainer: document.querySelector('.tab-panels'),
    openTgModalBtn: document.getElementById('open-tg-modal-btn'),
    exclusiveTabBtn: document.getElementById('tab-exclusive'),
    backgroundAnimation: document.getElementById('background-animation'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalContent: document.getElementById('modal-content'),
    modalActions: document.getElementById('modal-actions'),
};

const CONSTANTS = {
    COPY_SUCCESS_DURATION: 2000,
    RESIZE_DEBOUNCE_DELAY: 150,
    TABS_ANIMATION_DURATION: 400,
    MODAL_ANIMATION_DURATION: 250,
};

const Utils = {
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
};

const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        DOM.root.classList.toggle('dark-theme', isDark);
        if (DOM.themeSwitcher) DOM.themeSwitcher.selected = isDark;
        DOM.themeSwitcher?.addEventListener('click', () => this.toggleTheme());
    },

    toggleTheme() {
        if (AppState.isThemeSwitching) return;
        AppState.isThemeSwitching = true;
        const isDark = DOM.root.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTimeout(() => (AppState.isThemeSwitching = false), CONSTANTS.TABS_ANIMATION_DURATION);
    },
};

const UIManager = {
    init() {
        this.initBackgroundAnimation();
        document.addEventListener('click', (e) => {
            const copyButton = e.target.closest('[data-clipboard-text]');
            if (copyButton) this.handleCopyClick(copyButton);
        });
    },

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
            }, CONSTANTS.COPY_SUCCESS_DURATION);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    },

    initBackgroundAnimation() {
        if (!DOM.backgroundAnimation || DOM.backgroundAnimation.children.length > 0) return;
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
        DOM.backgroundAnimation.appendChild(fragment);
    },
};

const ModalManager = {
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

        DOM.modalBackdrop.hidden = false;
        DOM.modalContainer.hidden = false;
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
        DOM.body.style.overflow = '';

        setTimeout(() => {
            DOM.modalBackdrop.hidden = true;
            DOM.modalContainer.hidden = true;
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

const TabsManager = {
    init() {
        if (!DOM.mainTabs) return;
        this.setupInitialTabState();
        DOM.exclusiveTabBtn?.addEventListener('click', (e) => this.handleExclusiveTabClick(e), true);
        DOM.mainTabs.addEventListener('change', (e) => this.handleTabChange(e));
        window.addEventListener('resize', Utils.debounce(() => this.updatePanelsHeight(), CONSTANTS.RESIZE_DEBOUNCE_DELAY));
    },

    handleExclusiveTabClick(e) {
        if (!AppState.ageGateConfirmed) {
            e.preventDefault();
            e.stopImmediatePropagation();
            ModalManager.openModal('age-gate');
        }
    },

    handleTabChange(e) {
        if (e.target.activeTab) this.switchTab(e.target.activeTab);
    },

    setupInitialTabState() {
        document.querySelectorAll('.tab-panel').forEach(p => {
            p.hidden = true;
            p.classList.remove('is-active');
        });
        const initialActiveTab = DOM.mainTabs.activeTab;
        if (!initialActiveTab) return;
        const panelId = initialActiveTab.getAttribute('aria-controls');
        const initialPanel = document.getElementById(panelId);
        if (initialPanel) {
            initialPanel.hidden = false;
            initialPanel.classList.add('is-active');
            AppState.activePanel = initialPanel;
            this.updatePanelsHeight();
        }
    },

    switchTab(newTab) {
        const newPanelId = newTab.getAttribute('aria-controls');
        const newPanel = document.getElementById(newPanelId);
        if (!newPanel || newPanel === AppState.activePanel) return;

        const oldPanel = AppState.activePanel;
        if (oldPanel) {
            oldPanel.classList.remove('is-active');
            setTimeout(() => {
                if (AppState.activePanel !== oldPanel) oldPanel.hidden = true;
            }, CONSTANTS.TABS_ANIMATION_DURATION);
        }

        newPanel.hidden = false;
        AppState.activePanel = newPanel;
        this.updatePanelsHeight();

        if (DOM.mainTabs.getBoundingClientRect().top < 0) {
            DOM.mainTabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    updatePanelsHeight() {
        if (!DOM.tabPanelsContainer || !AppState.activePanel) return;
        requestAnimationFrame(() => {
            DOM.tabPanelsContainer.style.height = `${AppState.activePanel.scrollHeight}px`;
            AppState.activePanel.classList.add('is-active');
        });
    },
};

async function initializeApp() {
    const componentsToWaitFor = [
        'md-icon-button',
        'md-icon',
        'md-tabs',
        'md-primary-tab',
        'md-filled-button',
        'md-filled-tonal-button',
        'md-text-button',
        'md-dialog'
    ];

    try {
        await Promise.all(componentsToWaitFor.map(tag => customElements.whenDefined(tag)));

        ThemeManager.init();
        UIManager.init();
        TabsManager.init();
        ModalManager.init();

        DOM.body.removeAttribute('data-loading');

    } catch (error) {
        console.error('Failed to initialize Material Web Components:', error);
        DOM.body.removeAttribute('data-loading');
    }
}

initializeApp();
