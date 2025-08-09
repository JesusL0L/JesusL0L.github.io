import { DOM } from './dom.js';

export const GalleryManager = {
    galleryInitialized: false,

    init() {
        if (!DOM.mainTabs || !DOM.artsTab) return;

        DOM.mainTabs.addEventListener('change', () => {
            if (DOM.artsTab.active) {
                setTimeout(() => this.initGallery(), 50);
            }
        });

        if (DOM.artsTab.active) {
            this.initGallery();
        }
    },

    initGallery() {
        if (this.galleryInitialized) return;
        const galleryElement = document.getElementById('lightgallery');
        if (galleryElement && typeof lightGallery !== 'undefined') {
            lightGallery(galleryElement, {
                plugins: [lgZoom],
                selector: 'a',
                download: false,
            });
            this.galleryInitialized = true;
        }
    }
};
