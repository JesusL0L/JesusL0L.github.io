import { AppState } from './appState.js';
import { DOM } from './dom.js';
import { CONSTANTS } from './constants.js';

export const ThemeManager = {
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
