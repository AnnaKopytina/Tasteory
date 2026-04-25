import { RecipeCard } from '../../components/recipe-card/recipe-card.js';

const profileState = {
    user: null,
    activeTab: 'recipes',
};

const tabs = [
    { id: 'recipes', label: 'Мои рецепты' },
    { id: 'groups', label: 'Мои группы' },
    { id: 'favorites', label: 'Избранное' }
];

const escapeHtml = window.AppUtils?.escapeHtml || ((v) => {
    return v;
});

const getInitials = window.AppUtils?.getInitials || ((n) => {
    if (n) {
        return n[0].toUpperCase();
    }
    return '?';
});

async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error('Не удалось загрузить файл');
    }
    const data = await res.json();
    return data.url || data.path;
}

export async function initProfilePage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.innerHTML = '<div class="loader">Загрузка профиля...</div>';

    await fetchProfileData();

    if (!profileState.user) {
        root.innerHTML = '<p style="text-align:center; padding:50px;">Ошибка загрузки. Попробуйте обновить страницу.</p>';
        return;
    }

    renderLayout(root);
    await renderActiveTabContent(root);
}

async function fetchProfileData() {
    try {
        const res = await fetch('/api/users/me', {
            credentials: 'include'
        });
        if (res.ok) {
            profileState.user = await res.json();
        } else {
            window.AppRouter.navigate('/auth');
        }
    } catch (e) {
        console.error(e);
    }
}

function renderLayout(root) {
    const user = profileState.user;

    root.innerHTML = `
        <section class="profile-page" id="profile-page-root">
            <div class="profile-hero page-card">
                <div class="profile-hero__left">
                    <div class="profile-avatar ${user.avatarUrl ? 'profile-avatar--image' : 'profile-avatar--fallback'}">
                        ${user.avatarUrl ? `<img src="${user.avatarUrl}">` : `<span>${getInitials(user.displayName)}</span>`}
                    </div>
                    <div class="profile-meta">
                        <h1 class="profile-name">${escapeHtml(user.displayName)}</h1>
                        <p class="profile-id">@${escapeHtml(user.username)}</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button type="button" class="profile-edit-btn" data-action="edit-profile">Редактировать</button>
                    <div class="profile-logout-control" id="logout-container">
                        <button type="button" class="profile-logout-icon-btn" data-action="logout-toggle">
                            ${window.AppIcons?.render?.('logout', 'profile-logout-icon') || '📤'}
                        </button>
                        <button type="button" class="profile-logout-btn" data-action="logout" 
                                style="background: #d32f2f; color: white; border: none; border-radius: 12px;">
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
            <div class="profile-tabs search-filters__filters">
                ${renderTabsHtml().trim()}
            </div>
            <div class="profile-content" id="profile-tab-content"></div>
        </section>
    `.trim();

    root.removeEventListener('click', handleProfileClicks);
    root.addEventListener('click', handleProfileClicks);
}

function renderTabsHtml() {
    return tabs.map((tab) => {
        return `
            <button type="button" 
                    class="search-filters__button profile-tab-btn ${profileState.activeTab === tab.id ? 'is-active' : ''}" 
                    data-tab="${tab.id}">
                ${tab.label}
            </button>
        `;
    }).join('');
}

async function renderActiveTabContent(root) {
    const container = root.querySelector('#profile-tab-content');
    if (!container) {
        return;
    }
    container.innerHTML = '<div class="loader">Загрузка контента...</div>';

    try {
        if (profileState.activeTab === 'recipes') {
            await renderRecipesTab(container);
        } else if (profileState.activeTab === 'groups') {
            await renderGroupsTab(container);
        } else if (profileState.activeTab === 'favorites') {
            await renderFavoritesTab(container, root);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = 'Ошибка загрузки данных.';
    }
}

async function renderRecipesTab(container) {
    const res = await fetch(`/api/recipes/user/${profileState.user.id}?page=1&pageSize=50`, {
        credentials: 'include'
    });
    const data = await res.json();
    if (!data.items?.length) {
        container.innerHTML = '<div class="profile-empty">Тут пока пусто</div>';
    } else {
        container.innerHTML = '<div class="profile-cards-grid"></div>';
        const recipes = data.items.map((r) => {
            return {
                ...r,
                image: r.mainImage,
                time: r.timeMinutes,
                author: r.authorName,
                isFavorite: r.isFavorite,
                favoritesCount: r.favoritesCount
            };
        });
        RecipeCard.renderRecipeCards(recipes, container.querySelector('.profile-cards-grid'));
    }
}

async function renderGroupsTab(container) {
    const res = await fetch('/api/users/me/groups?page=1&pageSize=50', {
        credentials: 'include'
    });
    const data = await res.json();
    container.innerHTML = `
        <div class="profile-groups-actions">
            <button type="button" class="profile-create-group-btn" data-action="create-group">Создать группу</button>
        </div>
        <div class="profile-groups-grid">
            ${data.items.map((group) => {
                return `
                <a class="profile-group-card page-card" href="/group/${group.id}">
                    <div class="profile-group-card__title">${escapeHtml(group.name)}</div>
                    <div class="profile-group-card__meta">${group.membersCount} участников</div>
                </a>`;
            }).join('')}
        </div>
    `.trim();
}

async function renderFavoritesTab(container, root) {
    const res = await fetch('/api/users/me/favorites?page=1&pageSize=50', {
        credentials: 'include'
    });
    const data = await res.json();

    if (!data.items?.length) {
        container.innerHTML = '<div class="profile-empty">У вас пока нет избранных рецептов.</div>';
    } else {
        container.innerHTML = '<div class="profile-cards-grid"></div>';
        const grid = container.querySelector('.profile-cards-grid');
        const recipes = data.items.map((r) => {
            return {
                ...r,
                image: r.mainImage,
                time: r.timeMinutes,
                author: r.authorName,
                isFavorite: true,
                favoritesCount: r.favoritesCount
            };
        });
        RecipeCard.renderRecipeCards(recipes, grid, {
            onFavoriteClick: (recipe) => {
                if (!recipe.isFavorite) {
                    renderActiveTabContent(root);
                }
            }
        });
    }
}

async function handleProfileClicks(e) {
    if (!document.getElementById('profile-page-root')) {
        return;
    }

    const target = e.target;
    const root = document.getElementById('content-root');

    const tabBtn = target.closest('[data-tab]');
    if (tabBtn) {
        profileState.activeTab = tabBtn.dataset.tab;
        renderLayout(root);
        await renderActiveTabContent(root);
        return;
    }

    if (target.closest('[data-action="logout-toggle"]')) {
        document.getElementById('logout-container')?.classList.toggle('is-open');
    }

    if (target.closest('[data-action="logout"]')) {
        await handleLogout();
    }

    if (target.closest('[data-action="create-group"]')) {
        window.GroupCreateModal?.open({
            onCreated: () => {
                initProfilePage();
            }
        });
    }

    if (target.closest('[data-action="edit-profile"]')) {
        openEditModal(root);
    }
}

async function handleLogout() {
    await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });
    if (window.AppRouter) {
        window.AppRouter.setAuthState(false);
        window.AppRouter.navigate('/main');
        window.dispatchEvent(new CustomEvent('auth:changed'));
    }
}

function openEditModal(root) {
    const user = profileState.user;
    const backdrop = document.createElement('div');
    backdrop.className = 'profile-edit-backdrop';
    backdrop.innerHTML = getEditModalTemplate(user).trim();

    document.body.appendChild(backdrop);
    setupEditModalEvents(backdrop, user);
}

function getEditModalTemplate(user) {
    return `
        <div class="profile-edit-modal">
            <div class="profile-edit-modal__header">
                <h2 class="profile-edit-modal__title">Настройки</h2>
                <button type="button" class="profile-edit-modal__close" id="modal-close">×</button>
            </div>
            <div class="profile-edit-modal__avatar-section">
                <div class="profile-edit-modal__avatar" id="edit-avatar-preview">
                    ${user.avatarUrl ? `<img src="${user.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : getInitials(user.displayName)}
                </div>
                <div class="profile-edit-modal__avatar-btns">
                    <button type="button" class="profile-edit-modal__btn-primary" id="change-pic">Сменить фото</button>
                    <button type="button" class="profile-edit-modal__btn-ghost" id="remove-pic">Удалить</button>
                </div>
            </div>
            <input type="file" id="avatar-file" hidden accept="image/*">
            <label class="profile-edit-modal__label">Имя профиля</label>
            <input type="text" id="edit-name" class="profile-edit-modal__input" value="${user.displayName}">
            <div class="profile-edit-modal__buttons">
                <button type="button" class="profile-edit-modal__btn-primary" id="save-profile">Сохранить</button>
                <button type="button" class="profile-edit-modal__btn-ghost" id="modal-cancel">Отмена</button>
            </div>
        </div>
    `;
}

function setupEditModalEvents(backdrop, user) {
    let currentAvatarUrl = user.avatarUrl;
    const closeModal = () => {
        backdrop.remove();
    };

    backdrop.querySelector('#change-pic').onclick = () => {
        backdrop.querySelector('#avatar-file').click();
    };

    backdrop.querySelector('#remove-pic').onclick = () => {
        currentAvatarUrl = "";
        backdrop.querySelector('#edit-avatar-preview').innerHTML = getInitials(backdrop.querySelector('#edit-name').value);
    };

    backdrop.querySelector('#avatar-file').onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            currentAvatarUrl = await uploadAvatar(file);
            backdrop.querySelector('#edit-avatar-preview').innerHTML = `<img src="${currentAvatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        }
    };

    backdrop.querySelector('#save-profile').onclick = async () => {
        const newName = backdrop.querySelector('#edit-name').value.trim();
        const res = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayName: newName,
                avatarUrl: currentAvatarUrl
            }),
            credentials: 'include'
        });
        if (res.ok) {
            closeModal();
            initProfilePage();
        }
    };

    backdrop.querySelector('#modal-close').onclick = closeModal;
    backdrop.querySelector('#modal-cancel').onclick = closeModal;
}