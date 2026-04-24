(() => {
    const escapeHtml = window.AppUtils?.escapeHtml || ((value) => {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    });

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

    function getModalTemplate() {
        return `
            <div class="group-modal" role="dialog" aria-modal="true" aria-label="Управление группами">
                <div class="group-modal__header">
                    <h2 class="group-modal__title">Управление группами</h2>
                    <button type="button" class="group-modal__close" data-action="close-group-modal" aria-label="Закрыть">×</button>
                </div>
                <div class="profile-tabs search-filters__filters" style="display: flex; flex-direction: row; gap: 10px; margin-bottom: 20px; width: 100%;">
                    <button type="button" class="search-filters__button profile-tab-btn is-active" data-modal-tab="create" style="flex: 1; height: 44px; font-size: 16px;">
                        Создать
                    </button>
                    <button type="button" class="search-filters__button profile-tab-btn" data-modal-tab="join" style="flex: 1; height: 44px; font-size: 16px;">
                        Вступить
                    </button>
                </div>
                <form class="group-modal__form" data-form-create>
                    <label class="group-modal__label">Название новой группы</label>
                    <input class="group-modal__input" name="groupName" type="text" placeholder="Например, Семья" maxlength="80" required />
                    <p class="group-modal__status" id="create-status"></p>
                    <div class="group-modal__actions">
                        <button type="button" class="group-modal__btn group-modal__btn--ghost" data-action="close-group-modal">Отмена</button>
                        <button type="submit" class="group-modal__btn">Создать</button>
                    </div>
                </form>
                <form class="group-modal__form" data-form-join style="display:none;">
                    <label class="group-modal__label">Код приглашения</label>
                    <input class="group-modal__input" name="inviteCode" type="text" placeholder="Например, AB12CD" maxlength="80" required />
                    <p class="group-modal__status" id="join-status"></p>
                    <div class="group-modal__actions">
                        <button type="button" class="group-modal__btn group-modal__btn--ghost" data-action="close-group-modal">Отмена</button>
                        <button type="submit" class="group-modal__btn">Присоединиться</button>
                    </div>
                </form>
            </div>
        `;
    }

    function showStatus(element, message, isError = false) {
        element.textContent = message;
        element.classList.toggle('is-error', isError);
        if (isError) {
            element.style.color = '#bf3f3f';
        } else {
            element.style.color = '#7b8795';
        }
    }

    async function handleCreateSubmit(form, statusElement, options, closeCallback) {
        const groupName = form.querySelector('input[name="groupName"]').value.trim();
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!groupName) {
            showStatus(statusElement, 'Введите название группы', true);
            return;
        }

        submitBtn.disabled = true;
        showStatus(statusElement, 'Создаем группу...');

        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName }),
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                if (typeof options.onCreated === 'function') {
                    options.onCreated();
                }
                window.dispatchEvent(new CustomEvent('groups:changed'));
                if (window.AppRouter) {
                    window.AppRouter.navigate(`/group/${data.id}`);
                }
                closeCallback();
            } else {
                showStatus(statusElement, 'Не удалось создать группу. Проверьте имя.', true);
            }
        } catch (error) {
            console.error(error);
            showStatus(statusElement, 'Ошибка сети. Попробуйте еще раз.', true);
        } finally {
            submitBtn.disabled = false;
        }
    }

    async function handleJoinSubmit(form, statusElement, options, closeCallback) {
        const inviteCode = form.querySelector('input[name="inviteCode"]').value.trim();
        const submitBtn = form.querySelector('button[type="submit"]');

        if (!inviteCode) {
            showStatus(statusElement, 'Введите код приглашения', true);
            return;
        }

        submitBtn.disabled = true;
        showStatus(statusElement, 'Проверяем код...');

        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: inviteCode }),
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                if (typeof options.onCreated === 'function') {
                    options.onCreated();
                }
                window.dispatchEvent(new CustomEvent('groups:changed'));
                if (window.AppRouter) {
                    window.AppRouter.navigate(`/group/${data.groupId}`);
                }
                closeCallback();
            } else {
                const err = await res.json().catch(() => {
                    return {};
                });
                showStatus(statusElement, err.message || 'Недействительный или просроченный код.', true);
            }
        } catch (error) {
            console.error(error);
            showStatus(statusElement, 'Ошибка сети. Попробуйте еще раз.', true);
        } finally {
            submitBtn.disabled = false;
        }
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

        const backdrop = document.createElement('div');
        backdrop.className = 'group-modal-backdrop';
        backdrop.innerHTML = getModalTemplate();
        root.appendChild(backdrop);

        const unbindBackdropPosition = bindBackdropToContentArea(backdrop);
        const formCreate = backdrop.querySelector('[data-form-create]');
        const formJoin = backdrop.querySelector('[data-form-join]');
        const statusCreate = backdrop.querySelector('#create-status');
        const statusJoin = backdrop.querySelector('#join-status');

        const closeModal = () => {
            unbindBackdropPosition();
            document.removeEventListener('keydown', onEscClose);
            backdrop.remove();
        };

        const onEscClose = (event) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };

        document.addEventListener('keydown', onEscClose);

        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop || event.target.closest('[data-action="close-group-modal"]')) {
                closeModal();
                return;
            }

            const tabBtn = event.target.closest('[data-modal-tab]');
            if (tabBtn) {
                backdrop.querySelectorAll('[data-modal-tab]').forEach((b) => {
                    b.classList.remove('is-active');
                });
                tabBtn.classList.add('is-active');

                if (tabBtn.dataset.modalTab === 'create') {
                    formCreate.style.display = 'grid';
                    formJoin.style.display = 'none';
                } else {
                    formCreate.style.display = 'none';
                    formJoin.style.display = 'grid';
                }
            }
        });

        formCreate.addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleCreateSubmit(formCreate, statusCreate, options, closeModal);
        });

        formJoin.addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleJoinSubmit(formJoin, statusJoin, options, closeModal);
        });

        return backdrop;
    }

    window.GroupCreateModal = { open };
})();