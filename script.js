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
            mainModal: document.getElementById('main-modal'),
            modalHeadline: document.getElementById('modal-headline'),
        };

        this.state = {
            isThemeSwitching: false,
            ageGateConfirmed: false,
            activePanel: null,
            modalSource: null, // Can be 'telegram' or 'exclusive-tab'
        };

        this.constants = {
            COPY_SUCCESS_DURATION: 2000,
            RESIZE_DEBOUNCE_DELAY: 150,
            ANIMATION_DURATION: 400,
            MODAL_CLOSE_DELAY: 100,
        };

        this.init();
    }

    init() {
        this.initTheme();
        this.initEventListeners();
        this.initTabs();
        this.initBackgroundAnimation();
    }

    static debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    initBackgroundAnimation() {
        if (!this.dom.backgroundAnimation) return;
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
        this.dom.mainModal?.addEventListener('closed', () => this.onModalClose());

        // Direct listener for Telegram button
        this.dom.openTgModalBtn?.addEventListener('click', () => {
            this.state.modalSource = 'telegram';
            this.showModal('channel-select');
        });

        // Delegated listener for modal actions (scoped to the modal)
        this.dom.mainModal?.addEventListener('click', (e) => {
            const modalActionButton = e.target.closest('[data-action]');
            if (modalActionButton) {
                this.handleModalAction(modalActionButton.dataset.action);
            }
        });

        // Delegated listener for copy buttons (scoped to the document)
        document.addEventListener('click', (e) => {
            const copyButton = e.target.closest('[data-clipboard-text]');
            if (copyButton) {
                this.handleCopyClick(copyButton);
            }
        });
    }

    toggleTheme() {
        if (this.state.isThemeSwitching) return;
        this.state.isThemeSwitching = true;
        const isDark = this.dom.root.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTimeout(() => (this.state.isThemeSwitching = false), this.constants.ANIMATION_DURATION);
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
            this.state.modalSource = 'exclusive-tab';
            this.showModal('age-gate');
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

        if (this.state.activePanel) {
            this.state.activePanel.classList.remove('is-active');
            setTimeout(() => {
                if (this.state.activePanel !== newPanel) {
                    this.state.activePanel.hidden = true;
                }
            }, this.constants.ANIMATION_DURATION);
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

    handleModalAction(action) {
        switch (action) {
            case 'show-age-gate':
                if (this.state.ageGateConfirmed) {
                    this.state.modalSource = 'exclusive-tab';
                    this.dom.mainModal.close('age-confirmed');
                } else {
                    this.state.modalSource = 'exclusive-tab';
                    this.showModal('age-gate');
                }
                break;
            case 'confirm-age':
                this.state.ageGateConfirmed = true;
                if (this.state.modalSource === 'exclusive-tab') {
                    this.dom.mainModal.close('age-confirmed');
                } else { // Assumes telegram source
                    window.open('https://t.me/+rHPxxmJ0SKRjY2Ri', '_blank', 'noopener,noreferrer');
                    this.dom.mainModal.close();
                }
                break;
            case 'back': // From age-gate
                this.showModal('channel-select');
                break;
            case 'close': // From channel-select
                this.dom.mainModal.close();
                break;
        }
    }

    showModal(viewName) {
        const { mainModal, modalHeadline, mainCard } = this.dom;

        const headText = {
            'channel-select': 'Выберите канал',
            'age-gate': 'Подтверждение возраста'
        };
        modalHeadline.textContent = headText[viewName] || '';

        mainModal.querySelectorAll('.modal-view, .modal-actions').forEach(el => el.hidden = true);

        const viewToShow = mainModal.querySelector(`.modal-view[data-view="${viewName}"]`);
        const actionsToShow = mainModal.querySelector(`.modal-actions[data-actions="${viewName}"]`);

        if (viewToShow) viewToShow.hidden = false;
        if (actionsToShow) actionsToShow.hidden = false;

        if (!mainModal.open) {
            mainModal.show();
            mainCard.classList.add('blurred');
        }
    }

    onModalClose() {
        this.dom.mainCard.classList.remove('blurred');

        if (this.dom.mainModal.returnValue === 'age-confirmed' && this.state.modalSource === 'exclusive-tab') {
            setTimeout(() => {
                this.dom.exclusiveTabBtn.click();
            }, this.constants.MODAL_CLOSE_DELAY);
        }

        this.state.modalSource = null;
    }
}

document.addEventListener('DOMContentLoaded', () => new App());
