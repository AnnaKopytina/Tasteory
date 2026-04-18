import { RecipeCard } from '../../components/recipe-card/RecipeCard.js';
import { SearchFilters } from '../../components/search-filters/SearchFilters.js';

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

const mockGroup = {
    id: '1',
    name: 'Семья',
    members: [
        { id: 'u1', name: 'Василькова Галина', role: 'Админ' },
        { id: 'u2', name: 'Петров Иван', role: 'Участник' },
        { id: 'u3', name: 'Сидорова Мария', role: 'Участник' },
        { id: 'u4', name: 'Кузнецова Ольга', role: 'Участник' }
    ],
    recipes: [
        {
            id: 'g1',
            type: 'breakfast',
            title: 'Полезный салат со свежими овощами',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=500&auto=format&fit=crop',
            author: 'Василькова Галина',
            time: 20,
            servings: 35,
            isFavorite: false
        },
        {
            id: 'g2',
            type: 'lunch',
            title: 'Паста с томатным соусом',
            image: 'https://img.povar.ru/main-micro/00/00/6c/83/spagetti_chetire_pomidora-825929.jpg',
            author: 'Петров Иван',
            time: 25,
            servings: 12,
            isFavorite: false
        },
        {
            id: 'g3',
            type: 'dinner',
            title: 'Запеченная курица с картофелем',
            image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=500&auto=format&fit=crop',
            author: 'Сидорова Мария',
            time: 50,
            servings: 6,
            isFavorite: true
        },
        {
            id: 'g4',
            type: 'breakfast',
            title: 'Овсянка с ягодами и орехами',
            image: 'https://images.unsplash.com/photo-1517093911940-08cb5b3952e7?q=80&w=500&auto=format&fit=crop',
            author: 'Кузнецова Ольга',
            time: 10,
            servings: 4,
            isFavorite: false
        },
        {
            id: 'g5',
            type: 'lunch',
            title: 'Крем-суп из тыквы',
            image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500&auto=format&fit=crop',
            author: 'Василькова Галина',
            time: 35,
            servings: 5,
            isFavorite: false
        },
        {
            id: 'g6',
            type: 'dinner',
            title: 'Лосось с овощами',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=500&auto=format&fit=crop',
            author: 'Петров Иван',
            time: 30,
            servings: 3,
            isFavorite: false
        }
    ]
};

const groupState = {
    activeTab: 'recipes',
    searchValue: '',
    activeFilters: new Set(['breakfast'])
};

export function initGroupPage(groupId) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    groupState.activeTab = 'recipes';
    groupState.searchValue = '';
    groupState.activeFilters = new Set(['breakfast']);

    const group = {
        ...mockGroup,
        id: groupId || mockGroup.id
    };

    root.innerHTML = `
        <section class="group-page">
            <div class="group-page__header">
            <h1 class="group-page__title">${group.name}</h1>
                <button class="group-page__menu-btn" data-action="open-group-menu" aria-label="Меню группы" title="Параметры">
                    ${window.AppIcons?.renderIcon('dots', 'group-page__menu-btn-icon') || ''}
                </button>
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
    const menuBtn = root.querySelector('[data-action="open-group-menu"]');
    if (!menuBtn) {
        return;
    }

    menuBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openGroupMenu(root, group);
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
            case 'add-recipe':
                window.location.href = '/create';
                break;
        }
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

        const alreadyExists = group.members.some((m) => String(m.id) === String(userId));
        if (alreadyExists) {
            showStatus(backdrop, 'Этот участник уже в группе', true);
            return;
        }

        group.members.push({
            id: userId,
            name: `Пользователь ${userId}`,
            role: 'Участник'
        });

        if (groupState.activeTab === 'members') {
            renderMembersTab(root.querySelector('[data-group-content]'), group);
        }

        backdrop.remove();
    });
}

function openRemoveMemberModal(root, group) {
    if (group.members.length === 0) {
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
                    <option value="">-- Выберите участника --</option>
                    ${group.members.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('')}
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

        const index = group.members.findIndex((m) => String(m.id) === String(memberId));
        if (index !== -1) {
            group.members.splice(index, 1);
        }

        if (groupState.activeTab === 'members') {
            renderMembersTab(root.querySelector('[data-group-content]'), group);
        }

        backdrop.remove();
    });
}

function setupGroupModal(backdrop) {
    function closeModal() {
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

    const recipes = group.recipes.filter((recipe) => {
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
        onFavoriteClick: () => {
            // Карточка сама меняет локальное состояние избранного, повторный рендер не нужен.
        }
    });
}

function renderMembersTab(content, group) {
    if (!group.members.length) {
        content.innerHTML = '<p class="group-page__empty">В этой группе пока нет участников.</p>';
        return;
    }

    content.innerHTML = `
        <ul class="group-page__members" aria-label="Участники группы">
            ${group.members.map((member) => `
                <li class="group-page__member">
                    <span class="group-page__member-avatar" aria-hidden="true">${member.name.slice(0, 1)}</span>
                    <div class="group-page__member-meta">
                        <p class="group-page__member-name">${member.name}</p>
                        <p class="group-page__member-role">${member.role}</p>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}
