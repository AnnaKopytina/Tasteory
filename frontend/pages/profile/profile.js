import { RecipeCard } from '../../components/recipe-card/recipe-card.js';

const profileState = {
    user: null,
    activeTab: 'recipes',
    recipePage: 1,
    recipeTotalPages: 1,
    favPage: 1,
    favTotalPages: 1
};

const tabs = [
    { id: 'recipes', label: 'Мои рецепты' },
    { id: 'groups', label: 'Мои группы' },
    { id: 'favorites', label: 'Избранное' }
];

const escapeHtml = window.AppUtils?.escapeHtml || (v => v);
const getInitials = window.AppUtils?.getInitials || (n => n ? n[0].toUpperCase() : '?');

async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error('Ошибка загрузки');
    }
    const data = await res.json();
    return data.url || data.path;
}

export async function initProfilePage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.innerHTML = '<div class="loader">Загрузка...</div>';

    await fetchProfileData();

    if (!profileState.user) {
        root.innerHTML = '<p style="text-align:center; padding:50px;">Ошибка загрузки.</p>';
        return;
    }

    renderLayout(root);
    await renderActiveTabContent(root);
}

async function fetchProfileData() {
    try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (res.ok) {
            profileState.user = await res.json();
            window.currentUserId = profileState.user.id;
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
                ${tabs.map(tab => `
                    <button type="button" 
                            class="search-filters__button profile-tab-btn ${profileState.activeTab === tab.id ? 'is-active' : ''}" 
                            data-tab="${tab.id}">
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
            <div class="profile-content" id="profile-tab-content"></div>
        </section>
    `;

    root.removeEventListener('click', handleProfileClicks);
    root.addEventListener('click', handleProfileClicks);
}

async function renderActiveTabContent(root) {
    const container = root.querySelector('#profile-tab-content');
    if (!container) {
        return;
    }

    if (profileState.activeTab === 'recipes') {
        profileState.recipePage = 1;
        await renderRecipesTab(container, root, false);
    } else if (profileState.activeTab === 'groups') {
        await renderGroupsTab(container);
    } else if (profileState.activeTab === 'favorites') {
        profileState.favPage = 1;
        await renderFavoritesTab(container, root, false);
    }
}

async function renderRecipesTab(container, root, append = false) {
    if (!append) {
        container.innerHTML = `
            <div class="profile-recipes-actions" style="margin-bottom: 20px;">
                <button type="button" class="profile-create-group-btn" onclick="window.AppRouter.navigate('/create')">➕ Создать рецепт</button>
            </div>
            <div class="profile-cards-grid"></div>
        `;
    }
    const grid = container.querySelector('.profile-cards-grid');

    try {
        const res = await fetch(`/api/recipes/user/${profileState.user.id}?page=${profileState.recipePage}&pageSize=50`, { credentials: 'include' });
        const data = await res.json();
        profileState.recipeTotalPages = data.totalPages;

        if (!append && !data.items?.length) {
            grid.innerHTML = '<div class="profile-empty">Тут пока пусто.</div>';
            return;
        }

        const mapped = data.items.map(r => ({
            ...r, image: r.mainImage, time: r.timeMinutes, author: r.authorName, isFavorite: r.isFavorite, favoritesCount: r.favoritesCount
        }));

        const temp = document.createElement('div');
        RecipeCard.renderRecipeCards(mapped, temp);
        while (temp.firstChild) {
            grid.appendChild(temp.firstChild);
        }

        renderLoadMoreBtn(container, root);
    } catch (e) {
        container.innerHTML = 'Ошибка загрузки.';
    }
}

async function renderGroupsTab(container) {
    container.innerHTML = '<div class="loader">Загрузка...</div>';
    const res = await fetch('/api/users/me/groups?page=1&pageSize=50', { credentials: 'include' });
    const data = await res.json();
    container.innerHTML = `
        <div class="profile-groups-actions">
            <button type="button" class="profile-create-group-btn" data-action="create-group">Создать группу</button>
        </div>
        <div class="profile-groups-grid">
            ${data.items.map(group => `
                <a class="profile-group-card page-card" href="/group/${group.id}">
                    <div class="profile-group-card__title">${escapeHtml(group.name)}</div>
                    <div class="profile-group-card__meta">${group.membersCount} участников</div>
                </a>`).join('')}
        </div>`;
}

async function renderFavoritesTab(container, root, append = false) {
    if (!append) {
        container.innerHTML = '<div class="profile-cards-grid"></div>';
    }
    const grid = container.querySelector('.profile-cards-grid');

    try {
        const res = await fetch(`/api/users/me/favorites?page=${profileState.favPage}&pageSize=50`, { credentials: 'include' });
        const data = await res.json();
        profileState.favTotalPages = data.totalPages;

        if (!append && !data.items?.length) {
            container.innerHTML = '<div class="profile-empty">У вас пока нет избранных рецептов.</div>';
            return;
        }

        const mapped = data.items.map(r => ({
            ...r, image: r.mainImage, time: r.timeMinutes, author: r.authorName, isFavorite: true, favoritesCount: r.favoritesCount
        }));

        const temp = document.createElement('div');
        RecipeCard.renderRecipeCards(mapped, temp, {
            onFavoriteClick: (recipe) => {
                if (!recipe.isFavorite) {
                    initProfilePage();
                }
            }
        });
        while (temp.firstChild) {
            grid.appendChild(temp.firstChild);
        }

        renderLoadMoreBtn(container, root);
    } catch (e) {
        container.innerHTML = 'Ошибка загрузки.';
    }
}

function renderLoadMoreBtn(container, root) {
    let oldBtn = document.getElementById('load-more-profile-btn');
    if (oldBtn) {
        oldBtn.remove();
    }

    const isRecipes = profileState.activeTab === 'recipes';
    const currentP = isRecipes ? profileState.recipePage : profileState.favPage;
    const totalP = isRecipes ? profileState.recipeTotalPages : profileState.favTotalPages;

    if (currentP < totalP) {
        const wrapper = document.createElement('div');
        wrapper.id = 'load-more-profile-btn';
        wrapper.style.cssText = 'display:flex; justify-content:center; padding:30px 0; width:100%; grid-column: 1 / -1;';
        
        const btn = document.createElement('button');
        btn.style.cssText = `
            background-color: #6a852f;
            color: white;
            border: none;
            border-radius: 14px;
            padding: 14px 40px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            box-shadow: 0 4px 12px rgba(106, 133, 47, 0.2);
            font-family: inherit;
        `;
        btn.textContent = 'Показать ещё';
        
        btn.onmouseover = () => {
            btn.style.backgroundColor = '#556b26';
        };
        btn.onmouseout = () => {
            btn.style.backgroundColor = '#6a852f';
        };

        btn.onclick = () => {
            btn.disabled = true;
            btn.textContent = 'Загрузка...';
            if (isRecipes) {
                profileState.recipePage++;
                renderRecipesTab(container, root, true);
            } else {
                profileState.favPage++;
                renderFavoritesTab(container, root, true);
            }
        };
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
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
        handleTabSwitch(tabBtn, root);
        return;
    }

    if (target.closest('[data-action="logout-toggle"]')) {
        document.getElementById('logout-container')?.classList.toggle('is-open');
    }

    if (target.closest('[data-action="logout"]')) {
        await executeLogout();
    }

    if (target.closest('[data-action="create-group"]')) {
        window.GroupCreateModal?.open({ onCreated: () => initProfilePage() });
    }

    if (target.closest('[data-action="edit-profile"]')) {
        openEditModal();
    }
}

async function handleTabSwitch(tabBtn, root) {
    profileState.activeTab = tabBtn.dataset.tab;
    renderLayout(root);
    await renderActiveTabContent(root);
}

async function executeLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.AppRouter.setAuthState(false);
    window.AppRouter.navigate('/auth');
}

function openEditModal() {
    const user = profileState.user;
    const backdrop = document.createElement('div');
    backdrop.className = 'profile-edit-backdrop';
    backdrop.innerHTML = `
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

    document.body.appendChild(backdrop);
    setupEditModalListeners(backdrop);
}

function setupEditModalListeners(backdrop) {
    const user = profileState.user;
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName: newName, avatarUrl: currentAvatarUrl }),
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