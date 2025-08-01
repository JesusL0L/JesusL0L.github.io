'use strict';

    function initThemeSwitcher() {
        const themeSwitcher = document.getElementById('theme-switcher');
        if (!themeSwitcher) return;

        const rootEl = document.documentElement;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');

        const setTheme = (isDark) => {
            rootEl.classList.toggle('dark-theme', isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        };

        setTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

        themeSwitcher.addEventListener('click', () => {
            setTheme(!rootEl.classList.contains('dark-theme'));
        });
    }

    function initCopyButtons() {
        document.querySelectorAll('[data-clipboard-text]').forEach(button => {
            const iconElement = button.querySelector('.material-symbols-outlined');
            const textSpan = button.querySelector('span:not(.material-symbols-outlined)');

            const originalIconHTML = iconElement ? iconElement.innerHTML : null;
            const originalText = textSpan ? textSpan.textContent : button.textContent;
            let timeoutId = null;

            button.addEventListener('click', async (e) => {
                e.preventDefault();
                if (button.classList.contains('copied')) return;

                const textToCopy = button.dataset.clipboardText;
                if (!textToCopy) return;

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    clearTimeout(timeoutId);
                    button.classList.add('copied');

                    // Упрощенная логика обновления
                    if (textSpan) textSpan.textContent = 'Скопировано!';
                    if (iconElement) iconElement.innerHTML = 'check_circle';

                    timeoutId = setTimeout(() => {
                        button.classList.remove('copied');
                        // Упрощенная логика восстановления
                        if (textSpan) textSpan.textContent = originalText;
                        if (iconElement) iconElement.innerHTML = originalIconHTML;
                    }, 2000);
                } catch (err) {
                    console.error('Ошибка при копировании: ', err);
                    alert("Не удалось скопировать.");
                }
            });
        });
    }

    function initBackgroundAnimation() {
        const background = document.getElementById('background-animation');
        if (!background || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
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

    /**
     * Улучшенная система вкладок.
     * Анимации сделаны более надежными и предсказуемыми.
     * Логика разделена на вспомогательные функции для лучшей читаемости и поддержки.
     */
    function initTabs() {
        const tabsContainer = document.querySelector('.tabs-container');
        if (!tabsContainer) return;

        const tabList = tabsContainer.querySelector('.tab-list');
        const tabIndicator = tabList.querySelector('.tab-indicator');
        const card = tabsContainer.closest('.card');
        let isAnimating = false;

        // Обновляет положение и размер индикатора активной вкладки.
        const updateIndicator = (activeTab) => {
            if (!activeTab || !tabIndicator) return;
            tabIndicator.style.left = `${activeTab.offsetLeft}px`;
            tabIndicator.style.width = `${activeTab.offsetWidth}px`;
        };

        // Запускает каскадную анимацию для кнопок-ссылок внутри панели.
        const animateLinkButtons = (panel) => {
            const gridToAnimate = panel.querySelector('.links-grid');
            if (!gridToAnimate) return;

            // Сброс анимации путем удаления и повторного добавления класса.
            gridToAnimate.classList.remove('animate-links');
            // requestAnimationFrame гарантирует, что браузер обработал удаление класса
            // перед его повторным добавлением в следующем кадре, тем самым перезапуская анимацию.
            requestAnimationFrame(() => {
                gridToAnimate.classList.add('animate-links');
            });
        };

        // Основная функция переключения вкладок.
        const switchTab = (newTab) => {
            if (isAnimating || newTab.classList.contains('is-active')) return;
            isAnimating = true;

            const oldTab = tabList.querySelector('.is-active');
            const oldPanel = document.getElementById(oldTab.getAttribute('aria-controls'));
            const newPanel = document.getElementById(newTab.getAttribute('aria-controls'));

            if (!oldPanel || !newPanel) {
                isAnimating = false;
                return;
            }

            // 1. Получаем текущую высоту для плавной анимации.
            const oldHeight = card.offsetHeight;
            card.style.height = `${oldHeight}px`;

            // 2. Деактивируем старую вкладку и панель.
            oldTab.classList.remove('is-active');
            oldTab.setAttribute('aria-selected', 'false');
            oldPanel.classList.remove('is-active');
            oldPanel.hidden = true;

            // 3. Активируем новую вкладку и панель.
            newTab.classList.add('is-active');
            newTab.setAttribute('aria-selected', 'true');
            newPanel.hidden = false;
            newPanel.classList.add('is-active');

            // 4. Перемещаем индикатор и запускаем анимацию ссылок.
            updateIndicator(newTab);
            animateLinkButtons(newPanel);

            // Плавно прокручиваем к вкладкам, если они ушли за пределы экрана.
            if (tabsContainer.getBoundingClientRect().top < 0) {
                tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // 5. Анимируем изменение высоты.
            requestAnimationFrame(() => {
                const newHeight = card.scrollHeight;

                const onTransitionEnd = (event) => {
                    if (event.target === card && event.propertyName === 'height') {
                        card.style.height = ''; // Сбрасываем высоту на auto для адаптивности.
                        card.removeEventListener('transitionend', onTransitionEnd);
                        isAnimating = false;
                    }
                };

                card.removeEventListener('transitionend', onTransitionEnd);
                card.addEventListener('transitionend', onTransitionEnd);

                card.style.height = `${newHeight}px`;

                // Если высота не изменилась, transitionend не сработает, поэтому очищаем вручную.
                if (oldHeight === newHeight) {
                    onTransitionEnd({ target: card, propertyName: 'height' });
                }
            });
        };

        tabList.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.tab-button');
            if (clickedTab) {
                e.preventDefault();
                switchTab(clickedTab);
            }
        });

        // Первоначальная настройка
        const initialActiveTab = tabList.querySelector('.is-active');
        if (initialActiveTab) {
            updateIndicator(initialActiveTab);
            const initialActivePanel = document.getElementById(initialActiveTab.getAttribute('aria-controls'));
            // Задерживаем начальную анимацию ссылок, чтобы она произошла после анимации появления карточки.
            // Анимация карточки: 450ms длительность + 200ms задержка = 650ms.
            setTimeout(() => {
                if (initialActivePanel) {
                    animateLinkButtons(initialActivePanel);
                }
            }, 650);
        }

        window.addEventListener('resize', () => {
            if (!isAnimating) {
                updateIndicator(tabList.querySelector('.is-active'));
            }
        });
    }

    function initTelegramModal() {
        const openBtn = document.getElementById('open-tg-modal-btn');
        const modal = document.getElementById('tg-modal');
        if (!openBtn || !modal) return;

        const modalContent = modal.querySelector('.modal-content');
        const closeBtn = modal.querySelector('.modal-close-btn');
        const hornyRedirectBtn = document.getElementById('horny-tg-redirect');
        const exclusiveTabBtn = document.getElementById('tab-exclusive');
        const focusableElements = modalContent.querySelectorAll('a[href], button:not([disabled])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const showModal = () => {
            modal.classList.add('is-visible');
            modal.setAttribute('aria-hidden', 'false');
            firstFocusable?.focus();
            document.addEventListener('keydown', handleModalKeydown);
        };

        const hideModal = () => {
            modal.classList.remove('is-visible');
            modal.setAttribute('aria-hidden', 'true');
            document.removeEventListener('keydown', handleModalKeydown);
            openBtn.focus();
        };

        const handleModalKeydown = (e) => {
            if (e.key === 'Escape') hideModal();
            if (e.key === 'Tab') trapFocus(e);
        };

        const trapFocus = (e) => {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        };

        openBtn.addEventListener('click', showModal);
        closeBtn.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        hornyRedirectBtn.addEventListener('click', () => {
            hideModal();
            exclusiveTabBtn?.click();
            exclusiveTabBtn?.focus();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initThemeSwitcher();
        initCopyButtons();
        initBackgroundAnimation();
        initTabs();
        initTelegramModal();
    });