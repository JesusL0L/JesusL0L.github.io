'use strict';

class App {
    constructor() {
        this.dom = {
            root: document.documentElement,
            themeSwitcher: document.getElementById('theme-switcher'),
            copyButtonsContainer: document.body,
            tabs: {
                container: document.querySelector('.tabs-container'),
                list: document.querySelector('.tab-list'),
                panels: document.querySelector('.tab-panels'),
            },
            telegramModal: {
                openBtn: document.getElementById('open-tg-modal-btn'),
                modal: document.getElementById('tg-modal'),
                closeBtn: document.querySelector('#tg-modal .modal-close-btn'),
                hornyRedirectBtn: document.getElementById('horny-tg-redirect'),
                exclusiveTabBtn: document.getElementById('tab-exclusive'),
            },
        };

        this.activeTab = null;
        this.activePanel = null;
        this.constants = {
            COPY_SUCCESS_DURATION: 2000,
            RESIZE_DEBOUNCE_DELAY: 150,
        };

        this.init();
    }

    init() {
        this.initThemeSwitcher();
        this.initCopyButtons();
        this.initTabs();
        this.initTelegramModal();
        this.initBackgroundAnimation();
    }

    static debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }

    initBackgroundAnimation() {
        const background = document.getElementById('background-animation');
        if (!background) return;
        const numShapes = 15;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < numShapes; i++) {
            const shape = document.createElement('span');
            shape.classList.add('shape');
            const size = Math.random() * 40 + 10;
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
            shape.style.left = `${Math.random() * 100}%`;
            shape.style.animationDuration = `${Math.random() * 15 + 10}s`;
            shape.style.animationDelay = `${Math.random() * 5}s`;
            fragment.appendChild(shape);
        }
        background.appendChild(fragment);
    }

    initThemeSwitcher() {
        if (!this.dom.themeSwitcher) return;

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

        this.dom.root.classList.toggle('dark-theme', isDark);

        this.dom.themeSwitcher.addEventListener('click', () => {
            const currentlyDark = this.dom.root.classList.toggle('dark-theme');
            localStorage.setItem('theme', currentlyDark ? 'dark' : 'light');
        });
    }

    initCopyButtons() {
        this.dom.copyButtonsContainer.addEventListener('click', async (e) => {
            const button = e.target.closest('[data-clipboard-text]');
            if (!button || button.disabled) return;

            const textToCopy = button.dataset.clipboardText;
            const textSpan = button.querySelector('span:not(.material-symbols-outlined)');
            const iconElement = button.querySelector('.material-symbols-outlined');
            const originalText = textSpan?.textContent ?? '';
            const originalIconHTML = iconElement?.innerHTML ?? '';

            try {
                await navigator.clipboard.writeText(textToCopy);

                button.disabled = true;
                button.classList.add('copied');
                if (textSpan) textSpan.textContent = 'Скопировано!';
                if (iconElement) iconElement.innerHTML = 'check_circle';

                setTimeout(() => {
                    button.disabled = false;
                    button.classList.remove('copied');
                    if (textSpan) textSpan.textContent = originalText;
                    if (iconElement) iconElement.innerHTML = originalIconHTML;
                }, this.constants.COPY_SUCCESS_DURATION);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    }

    initTabs() {
        if (!this.dom.tabs.container) return;

        this.dom.tabs.list.addEventListener('click', this.handleTabClick.bind(this));
        window.addEventListener('resize', App.debounce(this.handleResize.bind(this), this.constants.RESIZE_DEBOUNCE_DELAY));

        this.setupInitialTabState();
    }

    setupInitialTabState() {
        const initialActiveTab = this.dom.tabs.list.querySelector('.is-active');
        if (!initialActiveTab) return;

        const panelId = initialActiveTab.getAttribute('aria-controls');
        const initialPanel = this.dom.tabs.panels.querySelector(`#${panelId}`);

        if (initialPanel) {
            this.activeTab = initialActiveTab;
            this.activePanel = initialPanel;
            this.updatePanelsHeight();
        }
    }

    handleTabClick(e) {
        const clickedTab = e.target.closest('.tab-button');
        if (clickedTab && clickedTab !== this.activeTab) {
            this.switchTab(clickedTab);
        }
    }

    switchTab(newTab) {
        const newPanelId = newTab.getAttribute('aria-controls');
        const newPanel = this.dom.tabs.panels.querySelector(`#${newPanelId}`);
        if (!newPanel) return;

        if (this.activeTab) {
            this.activeTab.classList.remove('is-active');
            this.activeTab.setAttribute('aria-selected', 'false');
        }
        if (this.activePanel) {
            this.activePanel.classList.remove('is-active');
            this.activePanel.hidden = true;
        }

        newTab.classList.add('is-active');
        newTab.setAttribute('aria-selected', 'true');
        newPanel.hidden = false;

        requestAnimationFrame(() => {
            this.dom.tabs.panels.style.height = `${newPanel.scrollHeight}px`;
            newPanel.classList.add('is-active');
        });

        this.activeTab = newTab;
        this.activePanel = newPanel;

        if (this.dom.tabs.list.getBoundingClientRect().top < 0) {
            this.dom.tabs.list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updatePanelsHeight() {
        if (!this.dom.tabs.panels || !this.activePanel) return;
        requestAnimationFrame(() => {
            this.dom.tabs.panels.style.height = `${this.activePanel.scrollHeight}px`;
        });
    }

    handleResize() {
        this.updatePanelsHeight();
    }

    initTelegramModal() {
        const { openBtn, modal, closeBtn, hornyRedirectBtn, exclusiveTabBtn } = this.dom.telegramModal;
        if (!openBtn || !modal || !closeBtn) return;

        const showModal = () => {
            modal.classList.add('is-visible');
            modal.setAttribute('aria-hidden', 'false');
            document.addEventListener('keydown', handleModalKeydown);
            closeBtn.focus();
        };

        const hideModal = () => {
            modal.classList.remove('is-visible');
            modal.setAttribute('aria-hidden', 'true');
            document.removeEventListener('keydown', handleModalKeydown);
            openBtn.focus();
        };

        const handleModalKeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                hideModal();
            }
        };

        openBtn.addEventListener('click', showModal);
        closeBtn.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        hornyRedirectBtn?.addEventListener('click', () => {
            hideModal();
            exclusiveTabBtn?.click();
            exclusiveTabBtn?.focus();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new App());
