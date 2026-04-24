import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { createRecipeFiltersState as createGroupRecipeFiltersState } from '../../core/recipe-filters.js';
import { renderGroupRecipesControls, renderGroupRecipesList } from './group-recipes-ui.js';

const escapeHtml = window.AppUtils?.escapeHtml || ((v) => {
    return v;
});

let groupState = {
    group: null,
    activeTab: 'recipes',
    recipeFilters: createGroupRecipeFiltersState(),
    recipes: [],
    currentUserId: null,
    isOwner: false
};

export async function initGroupPage(groupId) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.innerHTML = '<div class="loader">Загрузка группы...</div>';

    try {
        const { userData, groupData, members } = await fetchGroupPageData(groupId);

        initializeGroupState(userData, groupData, members);

        renderLayout(root);
        await renderActiveTabContent(root, members);
    } catch (err) {
        renderError(root, err.message);
    }
}

async function fetchGroupPageData(groupId) {
    const userRes = await fetch('/api/users/me', {
        credentials: 'include'
    });
    let userData = null;
    if (userRes.ok) {
        userData = await userRes.json();
    }

    const res = await fetch(`/api/groups/${groupId}`, {
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error('Группа не найдена');
    }
    const groupData = await res.json();

    const membersRes = await fetch(`/api/groups/${groupId}/members`, {
        credentials: 'include'
    });
    const members = await membersRes.json();

    return {
        userData,
        groupData,
        members
    };
}

function initializeGroupState(userData, groupData, members) {
    if (userData) {
        groupState.currentUserId = String(userData.id).toLowerCase();
    }

    const meInGroup = members.find((m) => {
        return String(m.id).toLowerCase() === groupState.currentUserId;
    });

    groupState.group = groupData;
    groupState.isOwner = meInGroup?.role === 'Owner';
    groupState.activeTab = 'recipes';
    groupState.recipeFilters = createGroupRecipeFiltersState();
}

function renderError(root, message) {
    root.innerHTML = `
        <div class="page-card" style="text-align:center; padding: 40px;">
            <h2>Ошибка</h2>
            <p>${message}</p>
            <br>
            <a href="/main">На главную</a>
        </div>
    `;
}

function renderLayout(root) {
    root.innerHTML = `
        <section class="group-page" id="group-page-root">
            <div class="group-page__header">
                <h1 class="group-page__title">${escapeHtml(groupState.group.name)}</h1>
                <div class="group-page__header-actions">
                    <button class="group-page__menu-btn" data-action="open-group-menu">
                        ${window.AppIcons?.render?.('dots', 'group-page__menu-btn-icon') || '⋮'}
                    </button>
                </div>
            </div>
            <div class="group-page__tabs" style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="search-filters__button group-page__tab-btn is-active" data-tab="recipes" style="flex: 1; height: 50px; font-size: 20px;">Рецепты</button>
                <button class="search-filters__button group-page__tab-btn" data-tab="members" style="flex: 1; height: 50px; font-size: 20px;">Участники</button>
            </div>
            <div id="group-tab-content"></div>
        </section>
    `;

    root.removeEventListener('click', handleGroupClicks);
    root.addEventListener('click', handleGroupClicks);
}

async function renderActiveTabContent(root, membersList = null) {
    const container = root.querySelector('#group-tab-content');
    if (!container) {
        return;
    }

    if (groupState.activeTab === 'recipes') {
        await renderRecipesTab(container);
    } else {
        await renderMembersTab(container, membersList);
    }
}

async function renderRecipesTab(container) {
    container.innerHTML = '<div class="loader">Загрузка рецептов...</div>';
    try {
        const res = await fetch(`/api/groups/${groupState.group.id}/recipes?page=1&pageSize=50`, {
            credentials: 'include'
        });
        const data = await res.json();

        groupState.recipes = (data.items || []).map((r) => {
            return {
                ...r,
                image: r.mainImage,
                time: r.timeMinutes,
                author: r.authorName,
                isFavorite: r.isFavorite
            };
        });

        container.innerHTML = `
            <div class="group-page__recipes-controls" id="group-controls"></div>
            <div class="group-page__recipes-grid" id="group-grid"></div>
        `;

        const controls = container.querySelector('#group-controls');
        const grid = container.querySelector('#group-grid');

        renderGroupRecipesControls(controls, groupState.recipeFilters, () => {
            renderGroupRecipesList(grid, groupState.recipes, groupState.recipeFilters, {
                groupId: groupState.group.id
            });
        });
        renderGroupRecipesList(grid, groupState.recipes, groupState.recipeFilters, {
            groupId: groupState.group.id
        });
    } catch (e) {
        container.innerHTML = 'Ошибка загрузки рецептов';
    }
}

async function renderMembersTab(container, membersList) {
    const members = membersList || await (await fetch(`/api/groups/${groupState.group.id}/members`, {
        credentials: 'include'
    })).json();

    container.innerHTML = `
        <ul class="group-page__members" style="list-style:none; padding:0; display:grid; gap:10px;">
            ${members.map((m) => {
                const isMe = String(m.id).toLowerCase() === groupState.currentUserId;
                return renderMemberItem(m, isMe);
            }).join('')}
        </ul>
    `;
}

function renderMemberItem(m, isMe) {
    return `
        <li class="group-page__member" style="display:flex; align-items:center; justify-content:space-between; background:white; padding:12px 15px; border-radius:15px; border:1px solid #eee;">
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="width:36px; height:36px; background:#e9eef2; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">${m.name[0].toUpperCase()}</span>
                <div>
                    <b>${escapeHtml(m.name)} ${isMe ? '(Вы)' : ''}</b><br>
                    <small style="color:#7c8a98">${m.role === 'Owner' ? '👑 Владелец' : '👤 Участник'}</small>
                </div>
            </div>
            ${groupState.isOwner && !isMe ? `
                <button data-kick-id="${m.id}" data-kick-name="${m.name}" style="background:none; border:none; color:#d32f2f; cursor:pointer; font-size:18px; padding:5px;">✕</button>
            ` : ''}
        </li>
    `;
}

async function handleGroupClicks(e) {
    if (!document.getElementById('group-page-root')) {
        return;
    }
    const target = e.target;
    const root = document.getElementById('content-root');

    if (target.closest('[data-tab]')) {
        handleTabSwitch(target.closest('[data-tab]'), root);
        return;
    }

    if (target.closest('[data-kick-id]')) {
        await handleKickMember(target.closest('[data-kick-id]'));
        return;
    }

    if (target.closest('[data-action="open-group-menu"]')) {
        openGroupMenu(target.closest('[data-action="open-group-menu"]'));
    }
}

async function handleTabSwitch(tabBtn, root) {
    groupState.activeTab = tabBtn.dataset.tab;
    root.querySelectorAll('.group-page__tab-btn').forEach((btn) => {
        btn.classList.remove('is-active');
    });
    tabBtn.classList.add('is-active');
    await renderActiveTabContent(root);
}

async function handleKickMember(btn) {
    if (confirm(`Исключить участника ${btn.dataset.kickName}?`)) {
        const res = await fetch(`/api/groups/${groupState.group.id}/members/${btn.dataset.kickId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            initGroupPage(groupState.group.id);
        }
    }
}

function openGroupMenu(anchor) {
    const existing = document.querySelector('.group-page__menu');
    if (existing) {
        existing.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'group-page__menu';
    menu.innerHTML = generateMenuHtml();
    anchor.parentElement.appendChild(menu);

    bindMenuActions(menu);
    setupMenuAutoClose(menu);
}

function generateMenuHtml() {
    let menuHtml = `
        <button class="group-page__menu-item" id="menu-add-recipe">➕ Создать рецепт в группу</button>
        <button class="group-page__menu-item" id="menu-invite">🔗 Код приглашения</button>
    `;

    if (groupState.isOwner) {
        menuHtml += `
            <button class="group-page__menu-item" id="menu-add-user">👤 Добавить по @username</button>
            <button class="group-page__menu-item" id="menu-rename">✏️ Переименовать группу</button>
            <button class="group-page__menu-item" style="color:#d32f2f; border-top: 1px solid #eee;" id="menu-delete">🗑 Удалить группу</button>
        `;
    } else {
        menuHtml += `<button class="group-page__menu-item" style="color:#d32f2f; border-top: 1px solid #eee;" id="menu-leave">🚪 Покинуть группу</button>`;
    }
    return menuHtml;
}

function bindMenuActions(menu) {
    const addRecipeBtn = menu.querySelector('#menu-add-recipe');
    const inviteBtn = menu.querySelector('#menu-invite');

    if (addRecipeBtn) {
        addRecipeBtn.onclick = () => {
            window.AppRouter.navigate(`/create?groupId=${groupState.group.id}`);
            menu.remove();
        };
    }

    if (inviteBtn) {
        inviteBtn.onclick = async () => {
            await handleInviteCodeCopy(menu);
        };
    }

    if (groupState.isOwner) {
        bindOwnerMenuActions(menu);
    } else {
        bindMemberMenuActions(menu);
    }
}

function bindOwnerMenuActions(menu) {
    menu.querySelector('#menu-add-user').onclick = () => {
        const username = prompt("Введите @username:");
        if (username) {
            addUserByUsername(username);
        }
        menu.remove();
    };
    menu.querySelector('#menu-rename').onclick = () => {
        const n = prompt("Новое название:", groupState.group.name);
        if (n) {
            updateGroupName(n.trim());
        }
        menu.remove();
    };
    menu.querySelector('#menu-delete').onclick = () => {
        if (confirm("УДАЛИТЬ группу навсегда?")) {
            deleteGroup();
        }
        menu.remove();
    };
}

function bindMemberMenuActions(menu) {
    menu.querySelector('#menu-leave').onclick = () => {
        if (confirm("Выйти из группы?")) {
            leaveGroup();
        }
        menu.remove();
    };
}

async function handleInviteCodeCopy(menu) {
    try {
        const res = await fetch(`/api/groups/${groupState.group.id}/invite`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await res.json();
        await navigator.clipboard.writeText(data.inviteCode);
        alert(`Код приглашения скопирован: ${data.inviteCode}`);
        menu.remove();
    } catch (e) {
        alert("Ошибка получения кода.");
    }
}

function setupMenuAutoClose(menu) {
    setTimeout(() => {
        const close = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', close);
            }
        };
        document.addEventListener('click', close);
    }, 10);
}

async function updateGroupName(newName) {
    const res = await fetch(`/api/groups/${groupState.group.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: newName
        }),
        credentials: 'include'
    });
    if (res.ok) {
        window.dispatchEvent(new CustomEvent('groups:changed'));
        initGroupPage(groupState.group.id);
    }
}

async function addUserByUsername(username) {
    const res = await fetch(`/api/groups/${groupState.group.id}/members/by-username`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userName: username
        }),
        credentials: 'include'
    });
    if (res.ok) {
        initGroupPage(groupState.group.id);
    } else {
        alert("Пользователь не найден или уже в группе.");
    }
}

async function leaveGroup() {
    const res = await fetch(`/api/groups/${groupState.group.id}/members/me`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (res.ok) {
        window.dispatchEvent(new CustomEvent('groups:changed'));
        window.AppRouter.navigate('/main');
    } else {
        const err = await res.json().catch(() => {
            return {};
        });
        alert(err.message || "Ошибка");
    }
}

async function deleteGroup() {
    const res = await fetch(`/api/groups/${groupState.group.id}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (res.ok) {
        window.dispatchEvent(new CustomEvent('groups:changed'));
        window.AppRouter.navigate('/main');
    }
}