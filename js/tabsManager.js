import { AppState } from './appState.js';
import { DOM } from './dom.js';
import { CONSTANTS } from './constants.js';
import { Utils } from './utils.js';
import { ModalManager } from './modalManager.js';

export const TabsManager = {
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
