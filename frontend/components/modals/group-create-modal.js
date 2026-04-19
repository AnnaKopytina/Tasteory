(() => {
    const escapeHtml = window.AppUtils?.escapeHtml || ((value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;'));

    function buildMembersMarkup(memberIds) {
        if (!memberIds.length) {
            return '<li class="group-modal__hint">Пока нет добавленных участников</li>';
        }

        return memberIds.map((memberId, index) => `
            <li class="group-modal__member-item">
                <span>${escapeHtml(memberId)}</span>
                <button type="button" class="group-modal__remove-member" data-remove-index="${index}" aria-label="Удалить участника ${escapeHtml(memberId)}">×</button>
            </li>
        `).join('');
    }

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
        if (!root || !window.ApiService) {
            return null;
        }

        const existing = root.querySelector('.group-modal-backdrop');
        if (existing) {
            existing.remove();
        }

        const memberIds = [];
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

                    <label class="group-modal__label" for="member-id-input">Добавить участников по ID</label>
                    <div class="group-modal__member-add-row">
                        <input id="member-id-input" class="group-modal__input" type="text" placeholder="Введите ID пользователя" />
                        <button type="button" class="group-modal__add-member" data-action="add-member">Добавить</button>
                    </div>

                    <ul class="group-modal__members" data-members-list>
                        ${buildMembersMarkup(memberIds)}
                    </ul>

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
        const memberIdInput = backdrop.querySelector('#member-id-input');
        const membersList = backdrop.querySelector('[data-members-list]');
        const status = backdrop.querySelector('[data-group-status]');

        if (!form || !groupNameInput || !memberIdInput || !membersList || !status) {
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

        function updateMembersList() {
            membersList.innerHTML = buildMembersMarkup(memberIds);
        }

        function addMemberFromInput() {
            const value = memberIdInput.value.trim();
            if (!value) {
                showStatus('Введите ID участника', true);
                return;
            }

            if (memberIds.includes(value)) {
                showStatus('Этот ID уже добавлен', true);
                return;
            }

            memberIds.push(value);
            memberIdInput.value = '';
            showStatus('');
            updateMembersList();
            memberIdInput.focus();
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

            const addMemberButton = event.target.closest('[data-action="add-member"]');
            if (addMemberButton) {
                addMemberFromInput();
                return;
            }

            const removeMemberButton = event.target.closest('[data-remove-index]');
            if (!removeMemberButton) {
                return;
            }

            const index = Number(removeMemberButton.getAttribute('data-remove-index'));
            if (!Number.isInteger(index) || index < 0 || index >= memberIds.length) {
                return;
            }

            memberIds.splice(index, 1);
            showStatus('');
            updateMembersList();
        });

        memberIdInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addMemberFromInput();
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
                const createdGroup = await window.ApiService.addGroup(groupName, memberIds);
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

