import {RecipeCard} from '../../components/recipe-card/recipe-card.js';
import {createRecipeFiltersState as createGroupRecipeFiltersState} from '../../core/recipe-filters.js';
import {renderGroupRecipesControls, renderGroupRecipesList} from './group-recipes-ui.js';
import {el} from "../../core/dom.js";
import {GroupService} from "../../services/group-service.js";
import {AuthService} from "../../services/auth-service.js";
import {RecipeService} from "../../services/recipe-service.js";

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

export function getIconNode(iconName, className) {
    const iconStr = window.AppIcons?.render?.(iconName, className) || (iconName === 'dots' ? '⋮' : '');
    if (!iconStr || iconStr === '⋮') {
        return document.createTextNode(iconStr);
    }
    return new DOMParser().parseFromString(iconStr, 'text/html').body.firstChild;
}

export async function initGroupPage(groupId) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    if (!groupId) {
        await initGroupsList(root);
    } else {
        await initSingleGroup(root, groupId);
    }
}

async function initSingleGroup(root, groupId) {
    root.replaceChildren(el('div', {className: 'loader', textContent: 'Загрузка группы...'}));

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
        renderError(root, err.message || 'Ошибка загрузки группы');
    }
}

async function initGroupsList(root) {
    root.replaceChildren(el('div', {className: 'loader', textContent: 'Загрузка ваших групп...'}));

    try {
        const data = await GroupService.getMyGroups(1, 50);
        const groups = data.items || [];

        renderGroupsListLayout(root, groups);
    } catch (err) {
        renderError(root, err.message || 'Не удалось загрузить группы');
    }
}

function renderGroupsListLayout(root, groups) {
    const grid = el('div', {
        className: 'groups-grid',
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '20px'
        }
    });

    if (groups.length === 0) {
        grid.appendChild(el('p', {
            style: {gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#7c8a98'},
            textContent: 'У вас пока нет групп.'
        }));
    } else {
        groups.forEach(g => {
            const card = el('a', {
                    href: `/group/${g.id}`,
                    className: 'page-card group-card',
                    style: {
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        transition: 'transform 0.2s'
                    }
                },
                el('div', {
                    style: {
                        width: '50px',
                        height: '50px',
                        background: '#f28c50',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '20px'
                    }, textContent: g.name[0].toUpperCase()
                }),
                el('div', {},
                    el('h3', {style: {margin: '0', fontSize: '18px'}, textContent: g.name}),
                    el('small', {style: {color: '#7c8a98'}, textContent: 'Нажмите, чтобы открыть'})
                )
            );
            grid.appendChild(card);
        });
    }

    const section = el('section', {className: 'group-page'},
        el('div', {className: 'group-page__header'},
            el('h1', {className: 'group-page__title', textContent: 'Мои группы'}),
            el('button', {className: 'create-group-btn', id: 'create-new-group-btn', textContent: '+ Создать группу'})
        ),
        grid
    );

    root.replaceChildren(section);

    const createBtn = root.querySelector('#create-new-group-btn');
    if (createBtn) {
        createBtn.onclick = () => document.getElementById('add-group-btn')?.click();
    }
}

function ensureCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

async function fetchGroupInitialData(groupId) {
    const userPromise = AuthService.getCurrentUser().catch(() => null);

    const [userData, groupData, members] = await Promise.all([
        userPromise,
        GroupService.getById(groupId),
        GroupService.getMembers(groupId)
    ]);

    return [userData, groupData, members];
}

function renderLayout(root) {
    const section = el('section', {className: 'group-page', id: 'group-page-root'},
        el('div', {className: 'group-page__header'},
            el('h1', {className: 'group-page__title', textContent: groupState.group.name}),
            el('div', {className: 'group-page__header-actions'},
                el('button', {
                    className: 'group-page__menu-btn',
                    dataset: {action: 'open-group-menu'}
                }, getIconNode('dots', 'group-page__menu-btn-icon'))
            )
        ),
        el('div', {className: 'group-page__tabs', style: {display: 'flex', gap: '10px'}},
            el('button', {
                className: 'search-filters__button group-page__tab-btn is-active',
                dataset: {tab: 'recipes'},
                style: {flex: '1', height: '50px', fontSize: '20px'},
                textContent: 'Рецепты'
            }),
            el('button', {
                className: 'search-filters__button group-page__tab-btn',
                dataset: {tab: 'members'},
                style: {flex: '1', height: '50px', fontSize: '20px'},
                textContent: 'Участники'
            })
        ),
        el('div', {id: 'group-tab-content'})
    );

    root.replaceChildren(section);
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
    const controlsBox = el('div', {
        className: 'group-page__recipes-controls',
        id: 'group-controls',
        style: {marginBottom: '30px'}
    });
    const gridBox = el('div', {className: 'group-page__recipes-grid', id: 'group-grid'});

    container.replaceChildren(controlsBox, gridBox);
    groupState.currentPage = 1;

    const loadData = async (append = false) => {
        if (!append) {
            groupState.currentPage = 1;
            gridBox.replaceChildren(el('div', {className: 'loader', textContent: 'Ищем рецепты...'}));
        }

        const queryStr = constructRecipesQuery();

        try {
            const data = await GroupService.getRecipes(groupState.group.id, queryStr);
            handleRecipesResponse(data, gridBox, append, loadData);
        } catch (e) {
            gridBox.replaceChildren(el('p', {style: {color: 'red'}, textContent: 'Ошибка загрузки'}));
        }
    };

    renderGroupRecipesControls(controlsBox, groupState.recipeFilters, loadData);
    await loadData();
}

function constructRecipesQuery() {
    let q = `page=${groupState.currentPage}&pageSize=50`;
    const activeTags = Array.from(groupState.recipeFilters.activeFilters);

    if (activeTags.length > 0) {
        q += '&' + activeTags.map(t => `tags=${encodeURIComponent(t)}`).join('&');
    }
    if (groupState.recipeFilters.searchValue) {
        q += `&searchTerm=${encodeURIComponent(groupState.recipeFilters.searchValue)}`;
    }
    return q;
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
        gridBox.replaceChildren();
    }

    if (!append && recipes.length === 0) {
        gridBox.replaceChildren(el('p', {className: 'group-page__empty', textContent: 'Ничего не найдено'}));
    } else {
        const temp = document.createElement('div');
        renderGroupRecipesList(temp, recipes, groupState.recipeFilters, {groupId: groupState.group.id});

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
    ensureCSS('/pages/profile/profile.css');
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
        grid.replaceChildren(el('p', {textContent: 'Ошибка загрузки'}));
    }

    confirmBtn.onclick = async () => {
        await submitSelectedRecipes(selectedIds, confirmBtn, close);
    };
}

function createPickerModal() {
    return el('div', {className: 'profile-edit-backdrop', style: {zIndex: '1000'}},
        el('div', {
                className: 'profile-edit-modal',
                style: {maxWidth: '960px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'}
            },
            el('div', {className: 'profile-edit-modal__header', style: {flexShrink: '0', padding: '20px'}},
                el('h2', {className: 'profile-edit-modal__title', textContent: 'Добавить свои рецепты'}),
                el('button', {
                    type: 'button',
                    className: 'profile-edit-modal__close',
                    id: 'close-picker',
                    textContent: '×'
                })
            ),
            el('div', {style: {flex: '1', overflowY: 'auto', padding: '0 20px 20px 20px', scrollbarWidth: 'thin'}},
                el('div', {
                        id: 'picker-grid',
                        style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '16px',
                            alignItems: 'start'
                        }
                    },
                    el('div', {className: 'loader', textContent: 'Загрузка...'})
                )
            ),
            el('div', {
                    className: 'profile-edit-modal__buttons',
                    style: {
                        flexShrink: '0',
                        padding: '20px',
                        borderTop: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        background: '#fff'
                    }
                },
                el('button', {
                    type: 'button',
                    className: 'profile-edit-modal__btn-primary',
                    id: 'confirm-add-recipes',
                    disabled: true,
                    textContent: 'Добавить (0)'
                }),
                el('button', {
                    type: 'button',
                    className: 'profile-edit-modal__btn-ghost',
                    id: 'cancel-picker',
                    textContent: 'Отмена'
                })
            )
        )
    );
}

async function loadUserRecipesForPicker(grid, selectedIds, confirmBtn) {
    const data = await RecipeService.getUserRecipes(groupState.currentUserId, 1, 50);
    const items = data.items || [];

    if (items.length === 0) {
        grid.replaceChildren(el('p', {
            style: {gridColumn: '1/-1', textAlign: 'center', padding: '40px'},
            textContent: 'У вас пока нет своих рецептов.'
        }));
    } else {
        grid.replaceChildren();
        const mapped = items.map(r => ({
            ...r,
            image: r.mainImage,
            time: r.timeMinutes,
            author: r.authorName,
            isFavorite: r.isFavorite,
            favoritesCount: r.favoritesCount
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

    try {
        await GroupService.addRecipes(groupState.group.id, Array.from(selectedIds));
    } catch (e) {
        console.error("Ошибка при добавлении рецептов в группу", e);
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
    const menu = el('div', {className: 'group-page__menu'},
        el('button', {
            className: 'group-page__menu-item',
            id: 'menu-add-recipe',
            textContent: '➕ Создать новый рецепт'
        }),
        el('button', {
            className: 'group-page__menu-item',
            id: 'menu-pick-my-recipes',
            textContent: '🍱 Добавить из моих рецептов'
        }),
        el('button', {className: 'group-page__menu-item', id: 'menu-invite', textContent: '🔗 Код приглашения'})
    );

    if (groupState.isOwner) {
        menu.appendChild(el('button', {
            className: 'group-page__menu-item',
            id: 'menu-add-user',
            textContent: '👤 Добавить по @username'
        }));
        menu.appendChild(el('button', {
            className: 'group-page__menu-item',
            id: 'menu-rename',
            textContent: '✏️ Переименовать группу'
        }));
        menu.appendChild(el('button', {
            className: 'group-page__menu-item',
            id: 'menu-delete',
            style: {color: '#d32f2f', borderTop: '1px solid #eee'},
            textContent: '🗑 Удалить группу'
        }));
    } else {
        menu.appendChild(el('button', {
            className: 'group-page__menu-item',
            id: 'menu-leave',
            style: {color: '#d32f2f', borderTop: '1px solid #eee'},
            textContent: '🚪 Покинуть группу'
        }));
    }
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
            const data = await GroupService.generateInvite(groupState.group.id);
            await navigator.clipboard.writeText(data.inviteCode);
            alert(`Код скопирован: ${data.inviteCode}`);
            menu.remove();
        } catch (e) {
            alert("Ошибка получения кода приглашения");
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
        const wrapper = el('div', {
                id: 'load-more-group-wrapper',
                style: {display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0', gridColumn: '1 / -1'}
            },
            el('button', {
                className: 'create-btn',
                style: {
                    backgroundColor: '#6a852f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px 40px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'backgroundColor 0.2s',
                    boxShadow: '0 4px 12px rgba(106, 133, 47, 0.2)',
                    fontFamily: 'inherit',
                    width: '240px'
                },
                textContent: 'Показать ещё'
            })
        );

        const btn = wrapper.firstChild;
        btn.onclick = () => {
            btn.disabled = true;
            btn.textContent = 'Загрузка...';
            onLoadMore();
        };

        container.after(wrapper);
    }
}

async function renderMembersTab(container, membersList) {
    const members = membersList || await GroupService.getMembers(groupState.group.id);

    const ul = el('ul', {
        className: 'group-page__members',
        style: {listStyle: 'none', padding: '0', display: 'grid', gap: '10px'}
    });

    members.forEach(m => {
        const isMe = String(m.id).toLowerCase() === groupState.currentUserId;
        ul.appendChild(renderMemberItemNode(m, isMe));
    });

    container.replaceChildren(ul);
}

function renderMemberItemNode(m, isMe) {
    const crown = m.role === 'Owner' ? '👑 Владелец' : '👤 Участник';

    const li = el('li', {
            className: 'group-page__member',
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'white',
                padding: '12px 15px',
                borderRadius: '15px',
                border: '1px solid #eee'
            }
        },
        el('div', {style: {display: 'flex', alignItems: 'center', gap: '12px'}},
            el('span', {
                style: {
                    width: '36px',
                    height: '36px',
                    background: '#e9eef2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }, textContent: m.name[0].toUpperCase()
            }),
            el('div', {},
                el('b', {textContent: `${m.name} ${isMe ? '(Вы)' : ''}`}),
                el('br'),
                el('small', {style: {color: '#7c8a98'}, textContent: crown})
            )
        )
    );

    if (groupState.isOwner && !isMe) {
        li.appendChild(el('button', {
            dataset: {kickId: m.id, kickName: m.name},
            style: {
                background: 'none',
                border: 'none',
                color: '#d32f2f',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '5px'
            },
            textContent: '✕'
        }));
    }

    return li;
}

async function handleGroupClicks(e) {
    if (!document.getElementById('group-page-root')) return;

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
    root.querySelectorAll('.group-page__tab-btn').forEach(btn => btn.classList.remove('is-active'));
    tabBtn.classList.add('is-active');
    await renderActiveTabContent(root);
}

async function handleMemberKick(kickBtn) {
    if (confirm(`Исключить участника ${kickBtn.dataset.kickName}?`)) {
        try {
            await GroupService.kickMember(groupState.group.id, kickBtn.dataset.kickId);
            initGroupPage(groupState.group.id);
        } catch (e) {
            alert('Не удалось исключить участника');
        }
    }
}

async function updateGroupName(newName) {
    try {
        await GroupService.update(groupState.group.id, {name: newName});
        window.dispatchEvent(new CustomEvent('groups:changed'));
        initGroupPage(groupState.group.id);
    } catch (e) {
        alert('Не удалось переименовать группу');
    }
}

async function addUserByUsername(username) {
    try {
        await GroupService.addMemberByUsername(groupState.group.id, username);
        initGroupPage(groupState.group.id);
    } catch (e) {
        alert("Пользователь не найден.");
    }
}

async function leaveGroup() {
    try {
        await GroupService.leave(groupState.group.id);
        window.dispatchEvent(new CustomEvent('groups:changed'));
        window.AppRouter.navigate('/main');
    } catch (err) {
        alert(err.message || "Ошибка при выходе из группы");
    }
}

async function deleteGroup() {
    try {
        await GroupService.delete(groupState.group.id);
        window.dispatchEvent(new CustomEvent('groups:changed'));
        window.AppRouter.navigate('/main');
    } catch (err) {
        alert("Не удалось удалить группу");
    }
}

function renderError(root, message) {
    const card = el('div', {className: 'page-card', style: {textAlign: 'center', padding: '40px'}},
        el('h2', {textContent: 'Ошибка'}),
        el('p', {textContent: message}),
        el('br'),
        el('a', {href: '/main', textContent: 'На главную'})
    );
    root.replaceChildren(card);
}