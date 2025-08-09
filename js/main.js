import { ThemeManager } from './themeManager.js';
import { UIManager } from './uiManager.js';
import { TabsManager } from './tabsManager.js';
import { ModalManager } from './modalManager.js';
import { GalleryManager } from './galleryManager.js';

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
        
        // Since lightgallery is loaded via a separate script, 
        // we need to wait for DOMContentLoaded to ensure it's available.
        document.addEventListener('DOMContentLoaded', () => {
            GalleryManager.init();
        });

    } catch (error) {
        console.error('Failed to initialize Material Web Components:', error);
    }
}

initializeApp();
