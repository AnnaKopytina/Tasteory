import { RecipeCard } from '../../components/recipe-card/RecipeCard.js';
import { SearchFilters } from '../../components/search-filters/SearchFilters.js';
import {DataStore} from '../../services/data-store.js';

const escapeHtml = window.AppUtils?.escapeHtml || ((value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;'));

const RECIPE_FILTERS = [
    { id: 'breakfast', label: 'Завтрак' },
    { id: 'lunch', label: 'Обед' },
    { id: 'dinner', label: 'Ужин' }
];

const groupState = {
    activeTab: 'recipes',
    searchValue: '',
    activeFilters: new Set()
};

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

function getGroupById(groupId) {
    return DataStore.getGroupById(groupId);
}

function getGroupMembers(group) {
    return DataStore.getGroupMembers(group);
}

function getGroupRecipes(group) {
    return DataStore.getGroupRecipes(group);
}

export function initGroupPage(groupId) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    groupState.activeTab = 'recipes';
    groupState.searchValue = '';
    groupState.activeFilters = new Set();

    const group = getGroupById(groupId);
    if (!group) {
        root.innerHTML = '<section class="group-page"><div class="group-page__empty">Группа не найдена</div></section>';
        return;
    }

    root.innerHTML = `
        <section class="group-page">
            <div class="group-page__header">
                <h1 class="group-page__title">${group.name}</h1>
                <div class="group-page__header-actions">
                    <button class="group-page__menu-btn" data-action="open-group-menu" aria-label="Меню группы" title="Параметры">
                        ${window.AppIcons?.render?.('dots', 'group-page__menu-btn-icon') || ''}
                    </button>
                </div>
            </div>

            <div class="group-page__tabs" role="tablist" aria-label="Раздел группы">
                <button
                    type="button"
                    role="tab"
                    class="search-filters__button group-page__tab-btn ${groupState.activeTab === 'recipes' ? 'is-active' : ''}"
                    aria-selected="${String(groupState.activeTab === 'recipes')}"
                    data-group-tab="recipes"
                >
                    Рецепты
                </button>
                <button
                    type="button"
                    role="tab"
                    class="search-filters__button group-page__tab-btn ${groupState.activeTab === 'members' ? 'is-active' : ''}"
                    aria-selected="${String(groupState.activeTab === 'members')}"
                    data-group-tab="members"
                >
                    Участники
                </button>
            </div>

            <div class="group-page__content" data-group-content></div>
        </section>
    `;

    bindMenuEvents(root, group);
    bindTabEvents(root, group);
    renderActiveTab(root, group);
}

function bindMenuEvents(root, group) {
    if (root.__groupMenuEventsBound) {
        return;
    }

    root.__groupMenuEventsBound = true;

    const menuBtn = root.querySelector('[data-action="open-group-menu"]');
    if (!menuBtn) {
        return;
    }

    root.addEventListener('click', (event) => {
        const action = event.target.closest('[data-action]');
        if (!action) {
            return;
        }

        const actionType = action.getAttribute('data-action');
        if (actionType === 'open-group-menu') {
            event.preventDefault();
            event.stopPropagation();
            openGroupMenu(root, group);
            return;
        }

        if (actionType === 'leave-group') {
            event.preventDefault();
            event.stopPropagation();
            openLeaveGroupModal(root, group);
            return;
        }

        if (actionType === 'remove-recipe') {
            event.preventDefault();
            event.stopPropagation();
            openRemoveRecipeModal(root, group);
        }
    });

    document.addEventListener('click', (event) => {
        const menu = root.querySelector('.group-page__menu');
        if (menu && !menu.contains(event.target) && event.target !== menuBtn) {
            menu.remove();
        }
    });
}

function openGroupMenu(root, group) {
    const existing = root.querySelector('.group-page__menu');
    if (existing) {
        existing.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'group-page__menu';
    menu.innerHTML = `
        <button class="group-page__menu-item" data-action="edit-group-name">Изменить название</button>
        <button class="group-page__menu-item" data-action="add-member">Добавить участника</button>
        <button class="group-page__menu-item" data-action="remove-member">Удалить участника</button>
        <button class="group-page__menu-item" data-action="add-recipe">Добавить рецепт</button>
        <button class="group-page__menu-item" data-action="remove-recipe">Удалить рецепт</button>
        <button class="group-page__menu-item" data-action="leave-group">Покинуть группу</button>
    `;

    const header = root.querySelector('.group-page__header');
    if (!header) {
        menu.remove();
        return;
    }

    header.appendChild(menu);

    menu.addEventListener('click', (event) => {
        const action = event.target.closest('[data-action]');
        if (!action) {
            return;
        }

        const actionType = action.getAttribute('data-action');
        menu.remove();

        switch (actionType) {
            case 'edit-group-name':
                openEditGroupNameModal(root, group);
                break;
            case 'add-member':
                openAddMemberModal(root, group);
                break;
            case 'remove-member':
                openRemoveMemberModal(root, group);
                break;
            case 'remove-recipe':
                openRemoveRecipeModal(root, group);
                break;
            case 'add-recipe':
                window.location.href = '/create';
                break;
            case 'leave-group':
                openLeaveGroupModal(root, group);
                break;
        }
    });
}

function openLeaveGroupModal(root, group) {
    const backdrop = document.createElement('div');
    backdrop.className = 'group-modal-backdrop';
    backdrop.innerHTML = `
        <div class="group-modal" role="dialog" aria-label="Покинуть группу">
            <div class="group-modal__header">
                <h2 class="group-modal__title">Покинуть группу</h2>
                <button type="button" class="group-modal__close" aria-label="Закрыть">×</button>
            </div>
            <form class="group-modal__form" data-form="leave-group">
                <p>Вы уверены, что хотите покинуть группу «${escapeHtml(group.name)}»?</p>
                <p class="group-modal__status" data-status></p>
                <div class="group-modal__actions">
                    <button type="button" class="group-modal__btn group-modal__btn--ghost">Отмена</button>
                    <button type="submit" class="group-modal__btn">Покинуть</button>
                </div>
            </form>
        </div>
    `;

    root.appendChild(backdrop);
    setupGroupModal(backdrop);

    backdrop.querySelector('[data-form="leave-group"]').addEventListener('submit', (event) => {
        event.preventDefault();

        DataStore.removeGroupById(group.id);
        window.dispatchEvent(new CustomEvent('groups:changed', { detail: { removedGroupId: group.id } }));
        window.location.href = '/main';
    });
}

function openEditGroupNameModal(root, group) {
    const backdrop = document.createElement('div');
    backdrop.className = 'group-modal-backdrop';
    backdrop.innerHTML = `
        <div class="group-modal" role="dialog" aria-label="Изменить название группы">
            <div class="group-modal__header">
                <h2 class="group-modal__title">Изменить название</h2>
                <button type="button" class="group-modal__close" aria-label="Закрыть">×</button>
            </div>
            <form class="group-modal__form" data-form="edit-name">
                <label class="group-modal__label" for="group-new-name">Новое название</label>
                <input id="group-new-name" class="group-modal__input" type="text" value="${escapeHtml(group.name)}" maxlength="80" required />
                <p class="group-modal__status" data-status></p>
                <div class="group-modal__actions">
                    <button type="button" class="group-modal__btn group-modal__btn--ghost">Отмена</button>
                    <button type="submit" class="group-modal__btn">Сохранить</button>
                </div>
            </form>
        </div>
    `;

    root.appendChild(backdrop);
    setupGroupModal(backdrop);

    backdrop.querySelector('[data-form="edit-name"]').addEventListener('submit', (event) => {
        event.preventDefault();
        const newName = backdrop.querySelector('input').value.trim();
        if (!newName) {
            showStatus(backdrop, 'Введите название', true);
            return;
        }
        group.name = newName;
        root.querySelector('.group-page__title').textContent = newName;
        window.dispatchEvent(new CustomEvent('groups:changed', { detail: { updatedGroupId: group.id } }));
        backdrop.remove();
    });
}

function openAddMemberModal(root, group) {
    const backdrop = document.createElement('div');
    backdrop.className = 'group-modal-backdrop';
    backdrop.innerHTML = `
        <div class="group-modal" role="dialog" aria-label="Добавить участника">
            <div class="group-modal__header">
                <h2 class="group-modal__title">Добавить участника</h2>
                <button type="button" class="group-modal__close" aria-label="Закрыть">×</button>
            </div>
            <form class="group-modal__form" data-form="add-member">
                <label class="group-modal__label" for="member-user-id">ID пользователя</label>
                <input id="member-user-id" class="group-modal__input" type="text" placeholder="Введите ID участника" maxlength="100" required />
                <p class="group-modal__status" data-status></p>
                <div class="group-modal__actions">
                    <button type="button" class="group-modal__btn group-modal__btn--ghost">Отмена</button>
                    <button type="submit" class="group-modal__btn">Добавить</button>
                </div>
            </form>
        </div>
    `;

    root.appendChild(backdrop);
    setupGroupModal(backdrop);

    backdrop.querySelector('[data-form="add-member"]').addEventListener('submit', (event) => {
        event.preventDefault();
        const userId = backdrop.querySelector('input').value.trim();
        if (!userId) {
            showStatus(backdrop, 'Введите ID пользователя', true);
            return;
        }

        const alreadyExists = (group.memberIds || []).some((memberId) => String(memberId) === String(userId));
        if (alreadyExists) {
            showStatus(backdrop, 'Этот участник уже в группе', true);
            return;
        }

        group.memberIds = Array.from(new Set([...(group.memberIds || []), userId]));

        if (groupState.activeTab === 'members') {
            renderMembersTab(root.querySelector('[data-group-content]'), group);
        }

        window.dispatchEvent(new CustomEvent('groups:changed', { detail: { updatedGroupId: group.id } }));

        backdrop.remove();
    });
}

function openRemoveMemberModal(root, group) {
    const members = getGroupMembers(group);
    if (members.length === 0) {
        alert('В группе нет участников для удаления');
        return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'group-modal-backdrop';
    backdrop.innerHTML = `
        <div class="group-modal" role="dialog" aria-label="Удалить участника">
            <div class="group-modal__header">
                <h2 class="group-modal__title">Удалить участника</h2>
                <button type="button" class="group-modal__close" aria-label="Закрыть">×</button>
            </div>
            <form class="group-modal__form" data-form="remove-member">
                <label class="group-modal__label" for="member-select">Выберите участника</label>
                <select id="member-select" class="group-modal__input group-modal__select" required>
                    <option value="">Выберите участника</option>
                    ${members.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('')}
                </select>
                <p class="group-modal__status" data-status></p>
                <div class="group-modal__actions">
                    <button type="button" class="group-modal__btn group-modal__btn--ghost">Отмена</button>
                    <button type="submit" class="group-modal__btn">Удалить</button>
                </div>
            </form>
        </div>
    `;

    root.appendChild(backdrop);
    setupGroupModal(backdrop);

    backdrop.querySelector('[data-form="remove-member"]').addEventListener('submit', (event) => {
        event.preventDefault();
        const memberId = backdrop.querySelector('select').value;
        if (!memberId) {
            showStatus(backdrop, 'Выберите участника', true);
            return;
        }

        const index = (group.memberIds || []).findIndex((m) => String(m) === String(memberId));
        if (index !== -1) {
            group.memberIds.splice(index, 1);
        }

        if (groupState.activeTab === 'members') {
            renderMembersTab(root.querySelector('[data-group-content]'), group);
        }

        window.dispatchEvent(new CustomEvent('groups:changed', { detail: { updatedGroupId: group.id } }));

        backdrop.remove();
    });
}

function openRemoveRecipeModal(root, group) {
    const recipes = getGroupRecipes(group);
    if (recipes.length === 0) {
        alert('В группе нет рецептов для удаления');
        return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'group-modal-backdrop';
    backdrop.innerHTML = `
        <div class="group-modal" role="dialog" aria-label="Удалить рецепт">
            <div class="group-modal__header">
                <h2 class="group-modal__title">Удалить рецепт</h2>
                <button type="button" class="group-modal__close" aria-label="Закрыть">×</button>
            </div>
            <form class="group-modal__form" data-form="remove-recipe">
                <label class="group-modal__label" for="recipe-select">Выберите рецепт</label>
                <select id="recipe-select" class="group-modal__input group-modal__select" required>
                    <option value="">Выберите рецепт</option>
                    ${recipes.map((recipe) => `<option value="${escapeHtml(recipe.id)}">${escapeHtml(recipe.title)}</option>`).join('')}
                </select>
                <p class="group-modal__status" data-status></p>
                <div class="group-modal__actions">
                    <button type="button" class="group-modal__btn group-modal__btn--ghost">Отмена</button>
                    <button type="submit" class="group-modal__btn">Удалить</button>
                </div>
            </form>
        </div>
    `;

    root.appendChild(backdrop);
    setupGroupModal(backdrop);

    backdrop.querySelector('[data-form="remove-recipe"]').addEventListener('submit', (event) => {
        event.preventDefault();
        const recipeId = backdrop.querySelector('select').value;
        if (!recipeId) {
            showStatus(backdrop, 'Выберите рецепт', true);
            return;
        }

        removeRecipeById(group, recipeId);
        if (groupState.activeTab === 'recipes') {
            renderRecipesTab(root.querySelector('[data-group-content]'), group);
        }

        window.dispatchEvent(new CustomEvent('groups:changed', { detail: { updatedGroupId: group.id } }));

        backdrop.remove();
    });
}

function removeRecipeById(group, recipeId) {
    const recipeIndex = (group.recipeIds || []).findIndex((id) => String(id) === String(recipeId));
    if (recipeIndex === -1) {
        return false;
    }

    group.recipeIds.splice(recipeIndex, 1);
    return true;
}

function setupGroupModal(backdrop) {
    const unbindBackdropPosition = bindBackdropToContentArea(backdrop);

    function closeModal() {
        unbindBackdropPosition();
        document.removeEventListener('keydown', onEscClose);
        backdrop.remove();
    }

    function onEscClose(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }

    document.addEventListener('keydown', onEscClose);

    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop || event.target.closest('[data-action="close"]')) {
            closeModal();
            return;
        }

        const closeBtn = event.target.closest('.group-modal__close');
        if (closeBtn) {
            closeModal();
            return;
        }

        const cancelBtn = event.target.closest('.group-modal__form .group-modal__btn--ghost');
        if (cancelBtn) {
            closeModal();
        }
    });
}

function showStatus(backdrop, message, isError = false) {
    const status = backdrop.querySelector('[data-status]');
    if (status) {
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }
}


function bindTabEvents(root, group) {
    if (root.__groupTabEventsBound) {
        return;
    }

    root.__groupTabEventsBound = true;

    root.querySelectorAll('[data-group-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-group-tab');
            if (!tabId || tabId === groupState.activeTab) {
                return;
            }

            groupState.activeTab = tabId;

            root.querySelectorAll('[data-group-tab]').forEach((tabButton) => {
                const isCurrent = tabButton.getAttribute('data-group-tab') === tabId;
                tabButton.classList.toggle('is-active', isCurrent);
                tabButton.setAttribute('aria-selected', String(isCurrent));
            });

            renderActiveTab(root, group);
        });
    });
}

function renderActiveTab(root, group) {
    const content = root.querySelector('[data-group-content]');
    if (!content) {
        return;
    }

    if (groupState.activeTab === 'members') {
        renderMembersTab(content, group);
        return;
    }

    renderRecipesTab(content, group);
}

function renderRecipesTab(content, group) {
    content.innerHTML = `
        <div class="group-page__recipes-controls" data-group-controls></div>
        <div class="group-page__recipes-grid" data-group-recipes></div>
    `;

    const controls = content.querySelector('[data-group-controls]');
    const recipesContainer = content.querySelector('[data-group-recipes]');

    if (!controls || !recipesContainer) {
        return;
    }

    SearchFilters.renderSearchFilters(controls, {
        placeholder: 'Искать',
        searchAriaLabel: 'Поиск рецептов группы',
        filters: RECIPE_FILTERS,
        searchValue: groupState.searchValue,
        activeFilters: Array.from(groupState.activeFilters),
        onSearch: (value) => {
            groupState.searchValue = value;
            renderRecipesList(recipesContainer, group);
        },
        onFilterToggle: (_, __, activeFilters) => {
            groupState.activeFilters = new Set(activeFilters);
            renderRecipesList(recipesContainer, group);
        }
    });

    renderRecipesList(recipesContainer, group);
}

function renderRecipesList(container, group) {
    const search = groupState.searchValue.trim().toLowerCase();
    const recipesSource = getGroupRecipes(group);

    const recipes = recipesSource.filter((recipe) => {
        const matchesSearch = !search
            || recipe.title.toLowerCase().includes(search)
            || recipe.author.toLowerCase().includes(search);

        const matchesFilters = groupState.activeFilters.size === 0 || groupState.activeFilters.has(recipe.type);

        return matchesSearch && matchesFilters;
    });

    if (!recipes.length) {
        container.innerHTML = '<p class="group-page__empty">Ничего не найдено. Попробуйте изменить поиск или фильтр.</p>';
        return;
    }

    RecipeCard.renderRecipeCards(recipes, container, {
        onFavoriteClick: (recipe) => {
            DataStore.setRecipeFavorite(recipe.id, recipe.isFavorite);
        }
    });
}

function renderMembersTab(content, group) {
	const members = getGroupMembers(group);
	if (!members.length) {
        content.innerHTML = '<p class="group-page__empty">В этой группе пока нет участников.</p>';
        return;
    }

    content.innerHTML = `
        <ul class="group-page__members" aria-label="Участники группы">
			${members.map((member) => `
                <li class="group-page__member">
                    <span class="group-page__member-avatar" aria-hidden="true">${member.name.slice(0, 1)}</span>
                    <div class="group-page__member-meta">
                        <p class="group-page__member-name">${member.name}</p>
                        <p class="group-page__member-role">${member.role} · Рецептов: ${member.recipeCount}</p>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}
