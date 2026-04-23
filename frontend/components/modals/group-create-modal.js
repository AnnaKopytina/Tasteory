import {DataStore} from '../../services/data-store.js';

(() => {
    const escapeHtml = window.AppUtils?.escapeHtml || ((value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;'));

    function findContentRoot() {
        return document.getElementById('content-root');
    }

    function bindBackdropToContentArea(backdrop) {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) {
            return () => {};
        }

        const syncPosition = () => {
            const rect = contentArea.getBoundingClientRect();
            const left = Math.max(0, rect.left);
            const top = Math.max(0, rect.top);
            const right = Math.min(window.innerWidth, rect.right);
            const bottom = Math.min(window.innerHeight, rect.bottom);
            const width = Math.max(0, right - left);
            const height = Math.max(0, bottom - top);

            if (!width || !height) {
                backdrop.style.left = '0';
                backdrop.style.top = '0';
                backdrop.style.width = '100vw';
                backdrop.style.height = '100vh';
                return;
            }

            backdrop.style.left = `${left}px`;
            backdrop.style.top = `${top}px`;
            backdrop.style.width = `${width}px`;
            backdrop.style.height = `${height}px`;
        };

        syncPosition();
        window.addEventListener('resize', syncPosition);
        window.addEventListener('scroll', syncPosition, true);

        return () => {
            window.removeEventListener('resize', syncPosition);
            window.removeEventListener('scroll', syncPosition, true);
        };
    }

    function open(options = {}) {
        const root = findContentRoot();
        if (!root) {
            return null;
        }

        const existing = root.querySelector('.group-modal-backdrop');
        if (existing) {
            existing.remove();
        }

        const inviteId = Math.random().toString(36).substring(2, 8);
        const inviteLink = `${window.location.origin}/join/${inviteId}`;

        const backdrop = document.createElement('div');
        backdrop.className = 'group-modal-backdrop';
        backdrop.innerHTML = `
            <div class="group-modal" role="dialog" aria-modal="true" aria-label="Создание группы">
                <div class="group-modal__header">
                    <h2 class="group-modal__title">Создать группу</h2>
                    <button type="button" class="group-modal__close" data-action="close-group-modal" aria-label="Закрыть">×</button>
                </div>

                <form class="group-modal__form" data-group-form>
                    <label class="group-modal__label" for="group-name-input">Название группы</label>
                    <input id="group-name-input" class="group-modal__input" name="groupName" type="text" placeholder="Например, Семья" maxlength="80" required />

                    <label class="group-modal__label" for="group-invite-link">Ссылка для приглашения</label>
                    <div class="group-modal__member-add-row">
                        <input id="group-invite-link" class="group-modal__input" type="text" value="${escapeHtml(inviteLink)}" readonly />
                        <button type="button" class="group-modal__add-member" data-action="copy-link">Копировать</button>
                    </div>

                    <p class="group-modal__status" data-group-status></p>

                    <div class="group-modal__actions">
                        <button type="button" class="group-modal__btn group-modal__btn--ghost" data-action="close-group-modal">Отмена</button>
                        <button type="submit" class="group-modal__btn">Создать</button>
                    </div>
                </form>
            </div>
        `;

        root.appendChild(backdrop);
        const unbindBackdropPosition = bindBackdropToContentArea(backdrop);

        const form = backdrop.querySelector('[data-group-form]');
        const groupNameInput = backdrop.querySelector('input[name="groupName"]');
        const inviteLinkInput = backdrop.querySelector('#group-invite-link');
        const status = backdrop.querySelector('[data-group-status]');

        if (!form || !groupNameInput || !inviteLinkInput || !status) {
            backdrop.remove();
            return null;
        }

        function closeModal() {
            unbindBackdropPosition();
            document.removeEventListener('keydown', onEscClose);
            backdrop.remove();
        }

        function showStatus(message, isError = false) {
            status.textContent = message;
            status.classList.toggle('is-error', isError);
        }

        function onEscClose(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        }

        document.addEventListener('keydown', onEscClose);

        backdrop.addEventListener('click', (event) => {
            const closeButton = event.target.closest('[data-action="close-group-modal"]');
            if (closeButton || event.target === backdrop) {
                closeModal();
                return;
            }

            const copyLinkButton = event.target.closest('[data-action="copy-link"]');
            if (copyLinkButton) {
                navigator.clipboard.writeText(inviteLinkInput.value).then(() => {
                    showStatus('Ссылка скопирована!');
                    setTimeout(() => showStatus(''), 3000);
                }).catch(() => {
                    showStatus('Не удалось скопировать ссылку', true);
                });
            }
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const groupName = groupNameInput.value.trim();
            if (!groupName) {
                showStatus('Введите название группы', true);
                return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }

            showStatus('Создаем группу...');

            try {
                const createdGroup = await Promise.resolve(DataStore.createGroup(groupName, []));
                window.dispatchEvent(new CustomEvent('groups:changed', { detail: createdGroup }));
                if (typeof options.onCreated === 'function') {
                    options.onCreated(createdGroup);
                }
                closeModal();
            } catch (error) {
                console.error('Create group error:', error);
                showStatus('Не удалось создать группу. Попробуйте еще раз.', true);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                }
            }
        });

        groupNameInput.focus();
        return backdrop;
    }

    window.GroupCreateModal = { open };
})();