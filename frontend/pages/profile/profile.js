import {RecipeCard} from '../../components/recipe-card/recipe-card.js';
import {el} from "../../core/dom.js";
import {getIconNode} from "../group/group.js";
import {AuthService} from "../../services/auth-service.js";
import {MediaService} from "../../services/media-service.js";
import {RecipeService} from "../../services/recipe-service.js";
import {GroupService} from "../../services/group-service.js";

const profileState = {
    user: null,
    activeTab: 'recipes',
    recipePage: 1,
    recipeTotalPages: 1,
    favPage: 1,
    favTotalPages: 1
};

const tabs = [
    {id: 'recipes', label: 'Мои рецепты'},
    {id: 'groups', label: 'Мои группы'},
    {id: 'favorites', label: 'Избранное'}
];

const getInitials = window.AppUtils?.getInitials || (n => n ? n[0].toUpperCase() : '?');

async function uploadAvatar(file) {
    if (!file) return null;
    try {
        const data = await MediaService.upload(file);
        return data.url || data.path;
    } catch (e) {
        throw new Error('Ошибка загрузки фото');
    }
}

export async function initProfilePage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.replaceChildren(el('div', {className: 'loader', textContent: 'Загрузка...'}));

    await fetchProfileData();

    if (!profileState.user) {
        root.replaceChildren(el('p', {style: {textAlign: 'center', padding: '50px'}, textContent: 'Ошибка загрузки.'}));
        return;
    }

    renderLayout(root);
    await renderActiveTabContent(root);
}

async function fetchProfileData() {
    try {
        profileState.user = await AuthService.getCurrentUser();
        window.currentUserId = profileState.user.id;
    } catch (e) {
        window.AppRouter.navigate('/auth');
    }
}

function renderLayout(root) {
    const user = profileState.user;

    const avatarContent = user.avatarUrl
        ? el('img', {src: user.avatarUrl})
        : el('span', {textContent: getInitials(user.displayName)});

    const tabsContainer = el('div', {className: 'profile-tabs search-filters__filters'});
    tabs.forEach(tab => {
        tabsContainer.appendChild(el('button', {
            type: 'button',
            className: `search-filters__button profile-tab-btn ${profileState.activeTab === tab.id ? 'is-active' : ''}`,
            dataset: {tab: tab.id},
            textContent: tab.label
        }));
    });

    const section = el('section', {className: 'profile-page', id: 'profile-page-root'},
        el('div', {className: 'profile-hero page-card'},
            el('div', {className: 'profile-hero__left'},
                el('div', {className: `profile-avatar ${user.avatarUrl ? 'profile-avatar--image' : 'profile-avatar--fallback'}`}, avatarContent),
                el('div', {className: 'profile-meta'},
                    el('h1', {className: 'profile-name', textContent: user.displayName}),
                    el('p', {className: 'profile-id', textContent: `@${user.username}`})
                )
            ),
            el('div', {className: 'profile-actions'},
                el('button', {
                    type: 'button',
                    className: 'profile-edit-btn',
                    dataset: {action: 'edit-profile'},
                    textContent: 'Редактировать'
                }),
                el('div', {className: 'profile-logout-control', id: 'logout-container'},
                    el('button', {
                            type: 'button',
                            className: 'profile-logout-icon-btn',
                            dataset: {action: 'logout-toggle'}
                        },
                        getIconNode('logout', 'profile-logout-icon', '📤')
                    ),
                    el('button', {
                        type: 'button',
                        className: 'profile-logout-btn',
                        dataset: {action: 'logout'},
                        style: {background: '#d32f2f', color: 'white', border: 'none', borderRadius: '12px'},
                        textContent: 'Выйти'
                    })
                )
            )
        ),
        tabsContainer,
        el('div', {className: 'profile-content', id: 'profile-tab-content'})
    );

    root.replaceChildren(section);
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
    let grid = container.querySelector('.profile-cards-grid');

    if (!append) {
        const actions = el('div', {className: 'profile-recipes-actions', style: {marginBottom: '20px'}},
            el('button', {
                type: 'button',
                className: 'profile-create-group-btn',
                textContent: '➕ Создать рецепт',
                onclick: () => window.AppRouter.navigate('/create')
            })
        );
        grid = el('div', {className: 'profile-cards-grid'});
        container.replaceChildren(actions, grid);
    }

    try {
        const data = await RecipeService.getUserRecipes(profileState.user.id, profileState.recipePage, 50);
        profileState.recipeTotalPages = data.totalPages || 1;

        if (!append && !data.items?.length) {
            grid.replaceChildren(el('div', {className: 'profile-empty', textContent: 'Тут пока пусто.'}));
            return;
        }

        const mapped = data.items.map(r => ({
            ...r,
            image: r.mainImage,
            time: r.timeMinutes,
            author: r.authorName,
            isFavorite: r.isFavorite,
            favoritesCount: r.favoritesCount
        }));

        const temp = document.createElement('div');
        RecipeCard.renderRecipeCards(mapped, temp);
        while (temp.firstChild) {
            grid.appendChild(temp.firstChild);
        }

        renderLoadMoreBtn(container, root);
    } catch (e) {
        container.replaceChildren(el('p', {textContent: 'Ошибка загрузки.'}));
    }
}

async function renderGroupsTab(container) {
    container.replaceChildren(el('div', {className: 'loader', textContent: 'Загрузка...'}));

    try {
        const data = await GroupService.getMyGroups(1, 50);

        const actions = el('div', {className: 'profile-groups-actions'},
            el('button', {
                type: 'button',
                className: 'profile-create-group-btn',
                dataset: {action: 'create-group'},
                textContent: 'Создать группу'
            })
        );

        const grid = el('div', {className: 'profile-groups-grid'});
        (data.items || []).forEach(group => {
            grid.appendChild(el('a', {className: 'profile-group-card page-card', href: `/group/${group.id}`},
                el('div', {className: 'profile-group-card__title', textContent: group.name}),
                el('div', {className: 'profile-group-card__meta', textContent: `${group.membersCount} участников`})
            ));
        });

        container.replaceChildren(actions, grid);
    } catch (e) {
        container.replaceChildren(el('p', {textContent: 'Ошибка загрузки.'}));
    }
}

async function renderFavoritesTab(container, root, append = false) {
    let grid = container.querySelector('.profile-cards-grid');

    if (!append) {
        grid = el('div', {className: 'profile-cards-grid'});
        container.replaceChildren(grid);
    }

    try {
        const data = await RecipeService.getFavorites(profileState.favPage, 50);
        profileState.favTotalPages = data.totalPages || 1;

        if (!append && !data.items?.length) {
            container.replaceChildren(el('div', {
                className: 'profile-empty',
                textContent: 'У вас пока нет избранных рецептов.'
            }));
            return;
        }

        const mapped = data.items.map(r => ({
            ...r,
            image: r.mainImage,
            time: r.timeMinutes,
            author: r.authorName,
            isFavorite: true,
            favoritesCount: r.favoritesCount
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
        container.replaceChildren(el('p', {textContent: 'Ошибка загрузки.'}));
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
        const wrapper = el('div', {
                id: 'load-more-profile-btn',
                style: {display: 'flex', justifyContent: 'center', padding: '30px 0', width: '100%', gridColumn: '1 / -1'}
            },
            el('button', {
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
                    fontFamily: 'inherit'
                }, textContent: 'Показать ещё'
            })
        );

        const btn = wrapper.firstChild;
        btn.onmouseover = () => btn.style.backgroundColor = '#556b26';
        btn.onmouseout = () => btn.style.backgroundColor = '#6a852f';

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
        window.GroupCreateModal?.open({onCreated: () => initProfilePage()});
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
    try {
        await AuthService.logout();
    } catch (e) {
        console.error("Ошибка при логауте", e);
    } finally {
        window.AppRouter.setAuthState(false);
        window.AppRouter.navigate('/auth');
    }
}

function openEditModal() {
    const user = profileState.user;

    const avatarPreviewContent = user.avatarUrl
        ? el('img', {
            src: user.avatarUrl,
            style: {width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}
        })
        : document.createTextNode(getInitials(user.displayName));

    const backdrop = el('div', {className: 'profile-edit-backdrop'},
        el('div', {className: 'profile-edit-modal'},
            el('div', {className: 'profile-edit-modal__header'},
                el('h2', {className: 'profile-edit-modal__title', textContent: 'Настройки'}),
                el('button', {
                    type: 'button',
                    className: 'profile-edit-modal__close',
                    id: 'modal-close',
                    textContent: '×'
                })
            ),
            el('div', {className: 'profile-edit-modal__avatar-section'},
                el('div', {className: 'profile-edit-modal__avatar', id: 'edit-avatar-preview'}, avatarPreviewContent),
                el('div', {className: 'profile-edit-modal__avatar-btns'},
                    el('button', {
                        type: 'button',
                        className: 'profile-edit-modal__btn-primary',
                        id: 'change-pic',
                        textContent: 'Сменить фото'
                    }),
                    el('button', {
                        type: 'button',
                        className: 'profile-edit-modal__btn-ghost',
                        id: 'remove-pic',
                        textContent: 'Удалить'
                    })
                )
            ),
            el('input', {type: 'file', id: 'avatar-file', hidden: true, accept: 'image/*'}),
            el('label', {className: 'profile-edit-modal__label', textContent: 'Имя профиля'}),
            el('input', {
                type: 'text',
                id: 'edit-name',
                className: 'profile-edit-modal__input',
                value: user.displayName
            }),
            el('div', {className: 'profile-edit-modal__buttons'},
                el('button', {
                    type: 'button',
                    className: 'profile-edit-modal__btn-primary',
                    id: 'save-profile',
                    textContent: 'Сохранить'
                }),
                el('button', {
                    type: 'button',
                    className: 'profile-edit-modal__btn-ghost',
                    id: 'modal-cancel',
                    textContent: 'Отмена'
                })
            )
        )
    );

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
        backdrop.querySelector('#edit-avatar-preview').replaceChildren(document.createTextNode(getInitials(backdrop.querySelector('#edit-name').value)));
    };

    backdrop.querySelector('#avatar-file').onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            currentAvatarUrl = await uploadAvatar(file);
            backdrop.querySelector('#edit-avatar-preview').replaceChildren(el('img', {
                src: currentAvatarUrl,
                style: {width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}
            }));
        }
    };

    backdrop.querySelector('#save-profile').onclick = async () => {
        const newName = backdrop.querySelector('#edit-name').value.trim();
        try {
            await AuthService.updateProfile({displayName: newName, avatarUrl: currentAvatarUrl});
            closeModal();
            initProfilePage();
        } catch (e) {
            alert('Ошибка при сохранении профиля');
        }
    };

    backdrop.querySelector('#modal-close').onclick = closeModal;
    backdrop.querySelector('#modal-cancel').onclick = closeModal;
}