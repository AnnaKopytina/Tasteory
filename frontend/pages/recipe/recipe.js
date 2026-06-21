import {RECIPE_FILTERS} from '../../core/recipe-filters.js';
import {NoteService} from "../../services/note-service.js";
import {RecipeService} from "../../services/recipe-service.js";
import {AuthService} from "../../services/auth-service.js";
import { el } from "../../core/dom.js";


export function getIcon(iconName, className) {
    const iconStr = window.AppIcons?.render?.(iconName, className) || (iconName === 'dots' ? '⋮' : '');
    if (!iconStr || iconStr === '⋮') {
        return document.createTextNode(iconStr);
    }
    return new DOMParser().parseFromString(iconStr, 'text/html').body.firstChild;
}

function getPlural(n, one, few, many) {
    let res = n % 10;
    if (n % 100 > 10 && n % 100 < 20) {
        return many;
    }
    if (res === 1) {
        return one;
    }
    if (res >= 2 && res <= 4) {
        return few;
    }
    return many;
}

window.currentRecipeData = null;
window.currentGroupId = null;
window.currentUserId = null;

window.saveNote = async function (stepId, text, isPrivate) {
    const gid = window.currentGroupId;
    const trimmed = text.trim();
    try {
        if (!trimmed) {
            await NoteService.delete(stepId, isPrivate, gid);
        } else {
            await NoteService.save(stepId, trimmed, isPrivate, gid);
        }
    } catch (e) {
        console.error('Ошибка сохранения заметки:', e);
    }
};

async function changeServings(delta) {
    const data = window.currentRecipeData;
    if (!data) {
        return;
    }
    const newVal = data.currentServings + delta;
    if (newVal >= 1 && newVal <= 99) {
        data.currentServings = newVal;
        renderFullPage(document.getElementById('content-root'), data);
    }
}

async function addNote(index, isPrivate) {
    const isAuth = await window.AppRouter.isAuthorized();
    if (!isAuth) {
        alert("Чтобы добавлять свои секретные заметки к шагам, нужно войти в аккаунт!");
        return;
    }

    const areaId = isPrivate ? `area-priv-${index}` : `area-group-${index}`;
    const container = document.getElementById(areaId);
    if (!container) {
        return;
    }

    container.replaceChildren(renderNoteElement('', index, isPrivate));
    const txt = container.querySelector('textarea');
    txt.focus();
}

async function toggleFavorite() {
    const isAuth = await window.AppRouter.isAuthorized();
    if (!isAuth) {
        return alert("Чтобы сохранять рецепты, нужно войти в аккаунт.");
    }

    const data = window.currentRecipeData;
    const isAdding = !data.isFavorite;
    try {
        await RecipeService.toggleFavorite(data.id, isAdding);
        data.isFavorite = isAdding;
        data.favoritesCount += isAdding ? 1 : -1;
        renderFullPage(document.getElementById('content-root'), data);
    } catch (e) {
        console.error('Ошибка добавления в избранное', e);
    }
}

export async function initRecipePage(params) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }
    const recipeId = params.get('id');
    if (!recipeId) {
        root.replaceChildren(el('div', { className: 'page-card', textContent: 'Рецепт не найден (ID не указан)' }));
        return;
    }
    window.currentGroupId = params.get('groupId');
    root.replaceChildren(el('div', { className: 'loader', textContent: 'Загрузка...' }));

    try {
        const user = await AuthService.getCurrentUser().catch(() => null);
        window.currentUserId = user ? String(user.id).toLowerCase() : null;

        const recipe = await RecipeService.getById(recipeId, window.currentGroupId);
        recipe.currentServings = recipe.basePortions;

        for (let step of recipe.steps) {
            step.myPrivateNote = null;
            step.myGroupNote = null;
            step.othersGroupNotes = [];
            if (window.currentUserId) {
                try {
                    const nData = await NoteService.getForStep(step.id, window.currentGroupId);

                    step.myPrivateNote = nData.myPrivateNote?.text || null;
                    const gNotes = nData.groupNotes || [];
                    step.myGroupNote = gNotes.find(n => String(n.authorId).toLowerCase() === window.currentUserId)?.text || null;
                    step.othersGroupNotes = gNotes.filter(n => String(n.authorId).toLowerCase() !== window.currentUserId);
                } catch (e) {
                    console.warn(`Не удалось загрузить заметки для шага ${step.id}:`, e.message);
                }
            }
        }

        window.currentRecipeData = recipe;
        renderFullPage(root, recipe);
    } catch (err) {
        root.replaceChildren(el('div', { className: 'page-card' },
            el('h1', { textContent: 'Упс!' }),
            el('p', { textContent: err.message })
        ));
    }
}

function renderFullPage(root, data) {
    root.replaceChildren(
        el('div', { className: 'recipe-inner' },
            renderHeaderCard(data),
            renderIngredientsCard(data),
            el('div', { className: 'page-card' },
                el('div', { className: 'steps-block' },
                    el('h2', { className: 'section-title', textContent: 'Как приготовить?' }),
                    el('div', { className: 'steps-list' },
                        data.steps.sort((a, b) => a.sortOrder - b.sortOrder).map((s, i) => renderSingleStep(s, i))
                    )
                )
            )
        )
    );

    root.querySelectorAll('.note-paper').forEach(t => {
        t.style.height = 'auto';
        t.style.height = t.scrollHeight + 'px';
    });
}

function renderHeaderCard(data) {
    const isAuthor = String(data.authorId).toLowerCase() === String(window.currentUserId).toLowerCase();

    return el('div', { className: 'page-card' },
        el('div', { className: 'recipe-header' },
            el('div', { className: 'recipe-header-left' },
                el('h1', { className: 'recipe-title', textContent: data.title }),
                el('p', { className: 'recipe-meta-author' },
                    'Автор ', el('span', { textContent: data.authorName })
                )
            ),
            el('div', { className: 'recipe-header-actions' },
                isAuthor && el('button', {
                    className: 'favorite-btn',
                    style: { background: 'none', padding: 0, width: '24px', height: '32px' },
                    onclick: () => window.AppRouter.navigate(`/create?editId=${data.id}`),
                    title: 'Редактировать'
                }, getIcon('edit', 'recipe-bookmark-icon')),
                el('button', {
                    className: `favorite-btn ${data.isFavorite ? 'active' : ''}`,
                    onclick: toggleFavorite
                }, el('span', { className: 'favorite-icon' }, getIcon('bookmark', 'recipe-bookmark-icon')))
            )
        ),
        data.mainImage && el('div', { className: 'recipe-image' },
            el('img', { src: data.mainImage })
        ),
        el('div', { className: 'recipe-badges' },
            el('div', { className: 'recipe-badge' },
                el('span', { className: 'recipe-badge__icon' }, getIcon('favoritesSmall', 'recipe-badge__svg')),
                el('span', { textContent: `${data.favoritesCount || 0} сохранили` })
            ),
            el('span', { className: 'recipe-dot-divider' }, getIcon('separator', 'recipe-dot-divider__svg')),
            el('div', { className: 'recipe-badge' },
                el('span', { textContent: `${data.currentServings} ${getPlural(data.currentServings, 'порция', 'порции', 'порций')}` })
            ),
            el('span', { className: 'recipe-dot-divider' }, getIcon('separator', 'recipe-dot-divider__svg')),
            el('div', { className: 'recipe-badge' },
                el('span', { className: 'recipe-badge__icon' }, getIcon('timeCircle', 'recipe-badge__svg')),
                el('span', { textContent: `${data.timeMinutes} Мин` })
            )
        ),
        data.tags?.length > 0 && el('div', { className: 'recipe-tags' },
            data.tags.filter(t => t.toLowerCase() !== "общее").map(tagId => {
                const filter = RECIPE_FILTERS.find(f => f.id === tagId.toLowerCase());
                return el('span', {
                    className: 'recipe-tag-item',
                    textContent: filter ? filter.label : tagId
                });
            })
        )
    );
}

function renderIngredientsCard(data) {
    const groups = data.ingredients.reduce((acc, item) => {
        const name = item.section || "Состав";
        if (!acc[name]) {
            acc[name] = [];
        }
        acc[name].push(item);
        return acc;
    }, {});

    return el('div', { className: 'page-card' },
        el('div', { className: 'ingredients-block' },
            el('div', { className: 'ingredients-header' },
                el('h2', {}, 'Ингредиенты ', el('span', { className: 'ing-count', textContent: data.ingredients.length })),
                el('div', { className: 'counter-rigth' },
                    el('span', { textContent: 'Количество порций:' }),
                    el('div', { className: 'servings-counter' },
                        el('button', { onclick: () => changeServings(-1), textContent: '-' }),
                        el('input', { type: 'number', value: data.currentServings, readOnly: true }),
                        el('button', { onclick: () => changeServings(1), textContent: '+' })
                    )
                )
            ),
            el('div', { className: 'ingredients-list' },
                Object.entries(groups).map(([name, items]) => el('div', { className: 'ing-group' },
                    el('div', { className: 'ing-group-header' }, el('span', { textContent: name })),
                    el('ul', { className: 'ing-items' },
                        items.map(item => {
                            const amount = (item.amount * (data.currentServings / data.basePortions)).toFixed(1);
                            return el('li', {},
                                el('span', { className: 'name', textContent: item.name }),
                                el('span', { className: 'dots' }),
                                el('span', { className: 'val', textContent: `${parseFloat(amount)} ${item.measure || ''}` })
                            );
                        })
                    )
                ))
            )
        )
    );
}

function renderSingleStep(step, i) {
    const showPrivBtn = !step.myPrivateNote;
    const showGroupBtn = window.currentGroupId && !step.myGroupNote;

    return el('div', { className: 'step-card' },
        el('div', { className: 'step-card__header' },
            el('h3', { textContent: `Шаг ${step.sortOrder}` }),
            el('div', { className: 'note-action' },
                showPrivBtn && el('button', { className: 'add-note-btn', onclick: () => addNote(i, true) },
                    el('span', { className: 'add-note-btn__icon' }, getIcon('plus', 'add-note-btn__icon-svg')),
                    el('span', { textContent: 'Добавить заметку' })
                ),
                showGroupBtn && el('button', { className: 'add-note-btn', onclick: () => addNote(i, false) },
                    el('span', { className: 'add-note-btn__icon' }, getIcon('plus', 'add-note-btn__icon-svg')),
                    el('span', { textContent: 'Добавить групповую заметку' })
                )
            )
        ),
        el('div', { className: `step-content ${step.mediaUrl ? 'grid-cols' : ''}` },
            step.mediaUrl && el('img', { src: step.mediaUrl, className: 'step-img' }),
            el('p', { className: 'step-text', textContent: step.content })
        ),
        el('div', { id: `area-priv-${i}` }, step.myPrivateNote ? renderNoteElement(step.myPrivateNote, i, true) : null),
        el('div', { id: `area-group-${i}` }, step.myGroupNote ? renderNoteElement(step.myGroupNote, i, false) : null),

        window.currentGroupId && step.othersGroupNotes?.length > 0 && el('div', { className: 'others-notes-block' },
            el('p', { className: 'others-notes-title', textContent: 'Советы участников:' }),
            step.othersGroupNotes.map(n => el('p', { className: 'others-notes-text' },
                el('b', { textContent: `${n.authorName}: ` }),
                n.text
            ))
        )
    );
}

function renderNoteElement(note, index, isPrivate) {
    const colorClass = isPrivate ? 'note-wrapper--private' : 'note-wrapper--group';

    const stepId = window.currentRecipeData.steps[index].id;
    return el('div', { className: `note-wrapper ${colorClass}` },
        el('button', {
            className: 'note-control-btn btn-delete',
            title: 'Удалить',
            onclick: async () => {
                await NoteService.delete(stepId, isPrivate, window.currentGroupId);
                document.getElementById(isPrivate ? `area-priv-${index}` : `area-group-${index}`).replaceChildren();
            }
        }, getIcon('plus', 'icon-close note-delete-icon')),
        el('textarea', {
            className: 'note-paper',
            placeholder: 'Напишите здесь...',
            value: note,
            oninput: (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            },
            onblur: async (e) => {
                const val = e.target.value.trim();
                if (!val) {
                    await NoteService.delete(stepId, isPrivate, window.currentGroupId);
                }
                else await NoteService.save(stepId, val, isPrivate, window.currentGroupId);
            }
        })
    );
}