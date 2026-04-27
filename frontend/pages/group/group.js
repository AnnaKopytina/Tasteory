import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { createRecipeFiltersState as createGroupRecipeFiltersState } from '../../core/recipe-filters.js';
import { renderGroupRecipesControls, renderGroupRecipesList } from './group-recipes-ui.js';

const escapeHtml = window.AppUtils?.escapeHtml || (v => v);

let groupState = {
    group: null,
    activeTab: 'recipes',
    recipeFilters: createGroupRecipeFiltersState(),
    recipes: [],
    currentUserId: null,
    isOwner: false,
    currentPage: 1,
    totalPages: 1
};

export async function initGroupPage(groupId) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }
    root.innerHTML = '<div class="loader">Загрузка группы...</div>';
    
    try {
        const [userData, groupData, members] = await fetchGroupInitialData(groupId);
        
        groupState.currentUserId = userData ? String(userData.id).toLowerCase() : null;
        groupState.group = groupData;
        groupState.isOwner = members.find(m => String(m.id).toLowerCase() === groupState.currentUserId)?.role === 'Owner';
        groupState.activeTab = 'recipes';
        groupState.recipeFilters = createGroupRecipeFiltersState();
        groupState.currentPage = 1;
        
        renderLayout(root);
        await renderActiveTabContent(root, members);
    } catch (err) {
        renderError(root, err.message);
    }
}

async function fetchGroupInitialData(groupId) {
    const [userRes, res, membersRes] = await Promise.all([
        fetch('/api/users/me', { credentials: 'include' }),
        fetch(`/api/groups/${groupId}`, { credentials: 'include' }),
        fetch(`/api/groups/${groupId}/members`, { credentials: 'include' })
    ]);
    
    if (!res.ok) {
        throw new Error('Группа не найдена');
    }
    
    const userData = userRes.ok ? await userRes.json() : null;
    const groupData = await res.json();
    const members = await membersRes.json();
    
    return [userData, groupData, members];
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
            <div class="group-page__tabs" style="display: flex; gap: 10px;">
                <button class="search-filters__button group-page__tab-btn is-active" data-tab="recipes" style="flex: 1; height: 50px; font-size: 20px;">Рецепты</button>
                <button class="search-filters__button group-page__tab-btn" data-tab="members" style="flex: 1; height: 50px; font-size: 20px;">Участники</button>
            </div>
            <div id="group-tab-content"></div>
        </section>`;
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
    container.innerHTML = `
        <div class="group-page__recipes-controls" id="group-controls" style="margin-bottom: 30px;"></div>
        <div class="group-page__recipes-grid" id="group-grid"></div>`;
        
    const controlsBox = container.querySelector('#group-controls');
    const gridBox = container.querySelector('#group-grid');
    groupState.currentPage = 1;

    const loadData = async (append = false) => {
        if (!append) {
            groupState.currentPage = 1;
            gridBox.innerHTML = '<div class="loader">Ищем рецепты...</div>';
        }

        const url = constructRecipesUrl();
        
        try {
            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();
            handleRecipesResponse(data, gridBox, append, loadData);
        } catch (e) { 
            gridBox.innerHTML = '<p style="color:red">Ошибка загрузки</p>'; 
        }
    };
    
    renderGroupRecipesControls(controlsBox, groupState.recipeFilters, loadData);
    await loadData();
}

function constructRecipesUrl() {
    let url = `/api/groups/${groupState.group.id}/recipes?page=${groupState.currentPage}&pageSize=50`;
    const activeTags = Array.from(groupState.recipeFilters.activeFilters);
    
    if (activeTags.length > 0) {
        url += '&' + activeTags.map(t => `tags=${encodeURIComponent(t)}`).join('&');
    }
    if (groupState.recipeFilters.searchValue) {
        url += `&searchTerm=${encodeURIComponent(groupState.recipeFilters.searchValue)}`;
    }
    return url;
}

function handleRecipesResponse(data, gridBox, append, loadCallback) {
    groupState.totalPages = data.totalPages || 1;
    const items = data.items || [];
    const recipes = items.map(r => ({
        ...r, 
        image: r.mainImage, 
        time: r.timeMinutes, 
        author: r.authorName, 
        isFavorite: r.isFavorite, 
        favoritesCount: r.favoritesCount
    }));

    if (!append) {
        gridBox.innerHTML = '';
    }
    
    if (!append && recipes.length === 0) {
        gridBox.innerHTML = '<p class="group-page__empty">Ничего не найдено</p>';
    } else {
        const temp = document.createElement('div');
        renderGroupRecipesList(temp, recipes, groupState.recipeFilters, { groupId: groupState.group.id });
        
        while (temp.firstChild) {
            gridBox.appendChild(temp.firstChild);
        }
        
        renderLocalPaginationButton(gridBox, groupState.currentPage, groupState.totalPages, () => {
            groupState.currentPage++;
            loadCallback(true);
        });
    }
}

export async function openMyRecipesPicker() {
    const backdrop = createPickerModal();
    document.body.appendChild(backdrop);
    
    const grid = backdrop.querySelector('#picker-grid');
    const confirmBtn = backdrop.querySelector('#confirm-add-recipes');
    const selectedIds = new Set();
    
    const close = () => {
        backdrop.remove();
    };
    
    backdrop.querySelector('#close-picker').onclick = close;
    backdrop.querySelector('#cancel-picker').onclick = close;
    
    try {
        await loadUserRecipesForPicker(grid, selectedIds, confirmBtn);
    } catch (e) { 
        grid.innerHTML = 'Ошибка загрузки'; 
    }
    
    confirmBtn.onclick = async () => {
        await submitSelectedRecipes(selectedIds, confirmBtn, close);
    };
}

function createPickerModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'profile-edit-backdrop';
    backdrop.style.zIndex = "1000";
    backdrop.innerHTML = `
        <div class="profile-edit-modal" style="max-width: 960px; height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
            <div class="profile-edit-modal__header" style="flex-shrink: 0; padding: 20px;">
                <h2 class="profile-edit-modal__title">Добавить свои рецепты</h2>
                <button type="button" class="profile-edit-modal__close" id="close-picker">×</button>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 0 20px 20px 20px; scrollbar-width: thin;">
                <div id="picker-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; align-items: start;">
                    <div class="loader">Загрузка...</div>
                </div>
            </div>
            <div class="profile-edit-modal__buttons" style="flex-shrink: 0; padding: 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; background: #fff;">
                <button type="button" class="profile-edit-modal__btn-primary" id="confirm-add-recipes" disabled>Добавить (0)</button>
                <button type="button" class="profile-edit-modal__btn-ghost" id="cancel-picker">Отмена</button>
            </div>
        </div>`;
    return backdrop;
}

async function loadUserRecipesForPicker(grid, selectedIds, confirmBtn) {
    const res = await fetch(`/api/recipes/user/${groupState.currentUserId}?page=1&pageSize=50`, { credentials: 'include' });
    const data = await res.json();
    const items = data.items || [];
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px;">У вас пока нет своих рецептов.</p>';
    } else {
        grid.innerHTML = '';
        const mapped = items.map(r => ({
            ...r, image: r.mainImage, time: r.timeMinutes, author: r.authorName, isFavorite: r.isFavorite, favoritesCount: r.favoritesCount
        }));
        RecipeCard.renderRecipeCards(mapped, grid);
        setupPickerInteractions(grid, selectedIds, confirmBtn);
    }
}

function setupPickerInteractions(grid, selectedIds, confirmBtn) {
    grid.querySelectorAll('.recipe-card').forEach(card => {
        const id = card.dataset.recipeId;
        card.removeAttribute('href');
        card.style.cursor = 'pointer';
        card.style.height = 'auto'; 
        card.onclick = (e) => {
            e.preventDefault();
            if (selectedIds.has(id)) {
                selectedIds.delete(id);
                card.style.backgroundColor = '';
                card.style.border = '';
                card.style.transform = '';
            } else {
                selectedIds.add(id);
                card.style.backgroundColor = '#f0fdf4';
                card.style.border = '2px solid #6a852f';
                card.style.transform = 'scale(0.98)';
            }
            confirmBtn.disabled = selectedIds.size === 0;
            confirmBtn.textContent = `Добавить выбранные (${selectedIds.size})`;
        };
    });
}

async function submitSelectedRecipes(selectedIds, confirmBtn, closeCallback) {
    confirmBtn.disabled = true;
    for (const id of selectedIds) {
        await fetch(`/api/groups/${groupState.group.id}/recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(id),
            credentials: 'include'
        });
    }
    closeCallback();
    initGroupPage(groupState.group.id);
}

function openGroupMenu(anchor) {
    const existing = document.querySelector('.group-page__menu');
    if (existing) { 
        existing.remove(); 
        return; 
    }
    
    const menu = createGroupMenuElement();
    anchor.parentElement.appendChild(menu);
    setupGroupMenuActions(menu);
    
    setTimeout(() => {
        const closeMenu = (e) => { 
            if (!menu.contains(e.target)) { 
                menu.remove(); 
                document.removeEventListener('click', closeMenu); 
            } 
        };
        document.addEventListener('click', closeMenu);
    }, 10);
}

function createGroupMenuElement() {
    const menu = document.createElement('div');
    menu.className = 'group-page__menu';
    menu.innerHTML = `
        <button class="group-page__menu-item" id="menu-add-recipe">➕ Создать новый рецепт</button>
        <button class="group-page__menu-item" id="menu-pick-my-recipes">🍱 Добавить из моих рецептов</button>
        <button class="group-page__menu-item" id="menu-invite">🔗 Код приглашения</button>
        ${groupState.isOwner ? `
            <button class="group-page__menu-item" id="menu-add-user">👤 Добавить по @username</button>
            <button class="group-page__menu-item" id="menu-rename">✏️ Переименовать группу</button>
            <button class="group-page__menu-item" style="color:#d32f2f; border-top: 1px solid #eee;" id="menu-delete">🗑 Удалить группу</button>
        ` : `
            <button class="group-page__menu-item" style="color:#d32f2f; border-top: 1px solid #eee;" id="menu-leave">🚪 Покинуть группу</button>
        `}`;
    return menu;
}

function setupGroupMenuActions(menu) {
    menu.querySelector('#menu-add-recipe').onclick = () => { 
        window.AppRouter.navigate(`/create?groupId=${groupState.group.id}`); 
        menu.remove(); 
    };
    menu.querySelector('#menu-pick-my-recipes').onclick = () => { 
        openMyRecipesPicker(); 
        menu.remove(); 
    };
    menu.querySelector('#menu-invite').onclick = async () => {
        try {
            const res = await fetch(`/api/groups/${groupState.group.id}/invite`, { method: 'POST', credentials: 'include' });
            const data = await res.json();
            await navigator.clipboard.writeText(data.inviteCode);
            alert(`Код скопирован: ${data.inviteCode}`);
            menu.remove();
        } catch (e) { 
            alert("Ошибка"); 
        }
    };
    
    if (groupState.isOwner) {
        menu.querySelector('#menu-add-user').onclick = () => { 
            const u = prompt("Введите @username:"); 
            if (u) {
                addUserByUsername(u);
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
            if (confirm("УДАЛИТЬ группу?")) {
                deleteGroup();
            } 
            menu.remove(); 
        };
    } else {
        menu.querySelector('#menu-leave').onclick = () => { 
            if (confirm("Выйти из группы?")) {
                leaveGroup();
            } 
            menu.remove(); 
        };
    }
}

function renderLocalPaginationButton(container, currentPage, totalPages, onLoadMore) {
    const old = document.getElementById('load-more-group-wrapper');
    if (old) {
        old.remove();
    }
    
    if (currentPage < totalPages) {
        const wrapper = document.createElement('div');
        wrapper.id = 'load-more-group-wrapper';
        wrapper.style.cssText = 'display: flex; justify-content: center; width: 100%; padding: 40px 0; grid-column: 1 / -1;';
        
        const btn = document.createElement('button');
        btn.className = 'create-btn';
        btn.style.cssText = 'background-color: #6a852f; color: white; border: none; border-radius: 14px; padding: 14px 40px; font-size: 18px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; box-shadow: 0 4px 12px rgba(106, 133, 47, 0.2); font-family: inherit; width: 240px;';
        btn.textContent = 'Показать ещё';
        btn.onclick = () => { 
            btn.disabled = true; 
            btn.textContent = 'Загрузка...'; 
            onLoadMore(); 
        };
        
        wrapper.appendChild(btn);
        container.after(wrapper);
    }
}

async function renderMembersTab(container, membersList) {
    const members = membersList || await (await fetch(`/api/groups/${groupState.group.id}/members`, { credentials: 'include' })).json();
    container.innerHTML = `<ul class="group-page__members" style="list-style:none; padding:0; display:grid; gap:10px;">
        ${members.map(m => renderMemberItem(m, String(m.id).toLowerCase() === groupState.currentUserId)).join('')}
    </ul>`;
}

function renderMemberItem(m, isMe) {
    const crown = m.role === 'Owner' ? '👑 Владелец' : '👤 Участник';
    const kickBtn = groupState.isOwner && !isMe ? `<button data-kick-id="${m.id}" data-kick-name="${m.name}" style="background:none; border:none; color:#d32f2f; cursor:pointer; font-size:18px; padding:5px;">✕</button>` : '';
    
    return `<li class="group-page__member" style="display:flex; align-items:center; justify-content:space-between; background:white; padding:12px 15px; border-radius:15px; border:1px solid #eee;">
        <div style="display:flex; align-items:center; gap:12px;">
            <span style="width:36px; height:36px; background:#e9eef2; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">${m.name[0].toUpperCase()}</span>
            <div><b>${escapeHtml(m.name)} ${isMe ? '(Вы)' : ''}</b><br><small style="color:#7c8a98">${crown}</small></div>
        </div>
        ${kickBtn}
    </li>`;
}

async function handleGroupClicks(e) {
    if (!document.getElementById('group-page-root')) {
        return;
    }
    
    const target = e.target;
    const root = document.getElementById('content-root');
    const tabBtn = target.closest('[data-tab]');
    
    if (tabBtn) {
        handleTabSwitch(tabBtn, root);
        return;
    }
    
    const kickBtn = target.closest('[data-kick-id]');
    if (kickBtn) {
        await handleMemberKick(kickBtn);
        return;
    }
    
    if (target.closest('[data-action="open-group-menu"]')) {
        openGroupMenu(target.closest('[data-action="open-group-menu"]'));
    }
}

async function handleTabSwitch(tabBtn, root) {
    groupState.activeTab = tabBtn.dataset.tab;
    root.querySelectorAll('.group-page__tab-btn').forEach(btn => {
        btn.classList.remove('is-active');
    });
    tabBtn.classList.add('is-active');
    await renderActiveTabContent(root);
}

async function handleMemberKick(kickBtn) {
    if (confirm(`Исключить участника ${kickBtn.dataset.kickName}?`)) {
        await fetch(`/api/groups/${groupState.group.id}/members/${kickBtn.dataset.kickId}`, { method: 'DELETE', credentials: 'include' });
        initGroupPage(groupState.group.id);
    }
}

async function updateGroupName(newName) {
    const res = await fetch(`/api/groups/${groupState.group.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: newName }), 
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
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userName: username }), 
        credentials: 'include' 
    });
    if (res.ok) {
        initGroupPage(groupState.group.id);
    } else { 
        alert("Пользователь не найден."); 
    }
}

async function leaveGroup() {
    const res = await fetch(`/api/groups/${groupState.group.id}/members/me`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { 
        window.dispatchEvent(new CustomEvent('groups:changed')); 
        window.AppRouter.navigate('/main'); 
    } else { 
        const err = await res.json().catch(() => ({})); 
        alert(err.message || "Ошибка"); 
    }
}

async function deleteGroup() {
    const res = await fetch(`/api/groups/${groupState.group.id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { 
        window.dispatchEvent(new CustomEvent('groups:changed')); 
        window.AppRouter.navigate('/main'); 
    }
}

function renderError(root, message) {
    root.innerHTML = `<div class="page-card" style="text-align:center; padding: 40px;"><h2>Ошибка</h2><p>${message}</p><br><a href="/main">На главную</a></div>`;
}