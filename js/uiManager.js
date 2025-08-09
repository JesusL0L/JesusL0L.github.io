import { DOM } from './dom.js';
import { CONSTANTS } from './constants.js';

export const UIManager = {
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
