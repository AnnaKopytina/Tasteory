import {RECIPE_FILTERS} from '../../core/recipe-filters.js';
import {NoteService} from "../../services/note-service.js";
import {RecipeService} from "../../services/recipe-service.js";
import {AuthService} from "../../services/auth-service.js";

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

window.autoResizeNote = function (textarea) {
    if (!textarea) {
        return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
};

window.changeServings = function (delta) {
    const data = window.currentRecipeData;
    if (!data) {
        return;
    }
    const newVal = data.currentServings + delta;
    if (newVal >= 1 && newVal <= 99) {
        data.currentServings = newVal;
        renderFullPage(document.getElementById('content-root'), data);
    }
};

window.addNote = async function (index, isPrivate) {
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

    container.innerHTML = renderNoteElement('', index, isPrivate);
    const txt = container.querySelector('textarea');
    window.autoResizeNote(txt);
    txt.focus();
};

window.deleteNote = async function (index, isPrivate) {
    const step = window.currentRecipeData.steps[index];
    const gid = window.currentGroupId;

    try {
        await NoteService.delete(step.id, isPrivate, gid);
        initRecipePage(new URLSearchParams(window.location.search));
    } catch (e) {
        console.error('Ошибка удаления заметки:', e);
    }
};

window.toggleFavorite = async function () {
    const isAuth = await window.AppRouter.isAuthorized();
    if (!isAuth) {
        alert("Чтобы сохранять рецепты, нужно войти в аккаунт.");
        return;
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
};

window.currentRecipeData = null;
window.currentGroupId = null;
window.currentUserId = null;

const escapeHtml = window.AppUtils?.escapeHtml || ((v) => {
    return v;
});

const renderIcon = (name, className = '') => {
    return window.AppIcons?.render?.(name, className) || '';
};

export async function initRecipePage(params) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }
    const recipeId = params.get('id');
    window.currentGroupId = params.get('groupId');
    root.innerHTML = '<div class="loader">Загрузка...</div>';

    try {
        await fetchUserInfo();
        const recipe = await fetchRecipeData(recipeId);
        await fetchNotesForSteps(recipe);

        window.currentRecipeData = recipe;
        renderFullPage(root, recipe);
    } catch (err) {
        root.innerHTML = `<div class="page-card"><h1>Упс!</h1><p>${err.message}</p></div>`;
    }
}

async function fetchUserInfo() {
    try {
        const userData = await AuthService.getCurrentUser();
        window.currentUserId = String(userData.id).toLowerCase();
    } catch (e) {
        window.currentUserId = null;
    }
}

async function fetchRecipeData(recipeId) {
    const recipe = await RecipeService.getById(recipeId, window.currentGroupId);
    recipe.currentServings = recipe.basePortions;
    return recipe;
}

async function fetchNotesForSteps(recipe) {
    for (let step of recipe.steps) {
        await fetchSingleStepNotes(step);
    }
}

async function fetchSingleStepNotes(step) {
    try {
        const nData = await NoteService.getForStep(step.id, window.currentGroupId);

        step.myPrivateNote = nData.myPrivateNote?.text || null;
        const gNotes = nData.groupNotes || [];
        step.myGroupNote = gNotes.find((n) => {
            return String(n.authorId).toLowerCase() === window.currentUserId;
        })?.text || null;
        step.othersGroupNotes = gNotes.filter((n) => {
            return String(n.authorId).toLowerCase() !== window.currentUserId;
        });
    } catch (e) {
    }
}

function renderFullPage(root, data) {
    root.innerHTML = `
        <div class="recipe-inner">
            ${renderHeaderCard(data).trim()}
            ${renderIngredientsCard(data).trim()}
            ${renderStepsCard(data).trim()}
        </div>
    `.trim();

    initializeNoteAutoResize();
}

function initializeNoteAutoResize() {
    document.querySelectorAll('.note-paper').forEach((t) => {
        window.autoResizeNote(t);
    });
}

function renderTagsList(tags) {
    return (tags || [])
        .filter(tagId => {
            return tagId.toLowerCase() !== "общее";
        })
        .map(tagId => {
            const filter = RECIPE_FILTERS.find(f => {
                return f.id === tagId.toLowerCase();
            });
            const label = filter ? filter.label : tagId;
            return `<span style="background: #e9eef2; color: #102e3f; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">${escapeHtml(label)}</span>`;
        }).join('');
}

function renderHeaderCard(data) {
    const isAuthor = String(data.authorId).toLowerCase() === String(window.currentUserId).toLowerCase();
    const imageHtml = data.mainImage
        ? `<div class="recipe-image"><img src="${data.mainImage}"></div>`
        : '';

    const tagsHtml = renderTagsList(data.tags);

    return `
        <div class="page-card">
            <div class="recipe-header">
                <div class="recipe-header-left">
                    <h1 class="recipe-title">${escapeHtml(data.title)}</h1>
                    <p class="recipe-meta-author">Автор <span>${escapeHtml(data.authorName)}</span></p>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    ${isAuthor ? `
                        <button class="favorite-btn" 
                                style="background: none; padding: 0; width: 24px; height: 32px;" 
                                onclick="window.AppRouter.navigate('/create?editId=${data.id}')" 
                                title="Редактировать">
                            ${window.AppIcons?.render?.('edit', 'recipe-bookmark-icon')}
                        </button>
                    ` : ''}
                    <button class="favorite-btn ${data.isFavorite ? 'active' : ''}" onclick="toggleFavorite()">
                        <span class="favorite-icon">${window.AppIcons?.render?.('bookmark', 'recipe-bookmark-icon')}</span>
                    </button>
                </div>
            </div>
            ${imageHtml} 
            <div class="recipe-badges" style="margin-bottom: ${tagsHtml ? '15px' : '0'};">
                <div class="recipe-badge">
                    <span class="recipe-badge__icon">${renderIcon('favoritesSmall', 'recipe-badge__svg')}</span>
                    <span>${data.favoritesCount || 0} сохранили</span>
                </div>
                <span class="recipe-dot-divider">${renderIcon('separator', 'recipe-dot-divider__svg')}</span>
                <div class="recipe-badge">
                    <span>${data.currentServings} ${getPlural(data.currentServings, 'порция', 'порции', 'порций')}</span>
                </div>
                <span class="recipe-dot-divider">${renderIcon('separator', 'recipe-dot-divider__svg')}</span>
                <div class="recipe-badge">
                    <span class="recipe-badge__icon">${renderIcon('timeCircle', 'recipe-badge__svg')}</span>
                    <span>${data.timeMinutes} Мин</span>
                </div>
            </div>

            ${tagsHtml ? `
                <div class="recipe-tags" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                    ${tagsHtml}
                </div>
            ` : ''}
        </div>
    `;
}

function renderIngredientsCard(data) {
    return `
        <div class="page-card">
            <div class="ingredients-block">
                <div class="ingredients-header">
                    <h2>Ингредиенты <span class="ing-count">${data.ingredients.length}</span></h2>
                    <div class="counter-rigth">
                        <span>Количество порций:</span>
                        <div class="servings-counter">
                            <button onclick="changeServings(-1)">-</button>
                            <input type="number" value="${data.currentServings}" readonly>
                            <button onclick="changeServings(1)">+</button>
                        </div>
                    </div>
                </div>
                <div class="ingredients-list">
                    ${renderIngredients(data).trim()}
                </div>
            </div>
        </div>
    `;
}

function renderStepsCard(data) {
    return `
        <div class="page-card">
            <div class="steps-block">
                <h2 class="section-title">Как приготовить?</h2>
                <div class="steps-list">
                    ${renderSteps(data).trim()}
                </div>
            </div>
        </div>
    `;
}

function renderIngredients(data) {
    const groups = data.ingredients.reduce((acc, item) => {
        const name = item.section || "Состав";
        if (!acc[name]) {
            acc[name] = [];
        }
        acc[name].push(item);
        return acc;
    }, {});
    return Object.entries(groups).map(([name, items]) => {
        return `
        <div class="ing-group">
            <div class="ing-group-header"><span>${escapeHtml(name)}</span></div>
            <ul class="ing-items">
                ${items.map((item) => {
            const ratio = data.currentServings / data.basePortions;
            const amount = (item.amount * ratio).toFixed(1);
            return `
                        <li>
                            <span class="name">${escapeHtml(item.name)}</span>
                            <span class="dots"></span>
                            <span class="val">${parseFloat(amount)} ${escapeHtml(item.measure || '')}</span>
                        </li>`;
        }).join('')}
            </ul>
        </div>`;
    }).join('');
}

function renderSteps(data) {
    return data.steps
        .sort((a, b) => {
            return a.sortOrder - b.sortOrder;
        })
        .map((step, i) => {
            return renderSingleStep(step, i);
        }).join('');
}

function renderSingleStep(step, i) {
    const privNoteText = step.myPrivateNote || '';
    const groupNoteText = step.myGroupNote || '';
    const showPrivBtn = !step.myPrivateNote;
    const showGroupBtn = window.currentGroupId && !step.myGroupNote;

    return `
    <div class="step-card">
        <div class="step-card__header">
            <h3>Шаг ${step.sortOrder}</h3>
            <div class="note-action" style="display: flex; gap: 12px;">
                ${showPrivBtn ? `
                    <button class="add-note-btn" onclick="addNote(${i}, true)">
                        <span class="add-note-btn__icon" aria-hidden="true">${renderIcon('plus', 'add-note-btn__icon-svg')}</span>
                        <span>Добавить заметку</span>
                    </button>` : ''}
                ${showGroupBtn ? `
                    <button class="add-note-btn" onclick="addNote(${i}, false)">
                        <span class="add-note-btn__icon" aria-hidden="true">${renderIcon('plus', 'add-note-btn__icon-svg')}</span>
                        <span>Добавить групповую заметку</span>
                    </button>` : ''}
            </div>
        </div>
        <div class="step-content ${step.mediaUrl ? 'grid-cols' : ''}">
            ${step.mediaUrl ? `<img src="${step.mediaUrl}" class="step-img">` : ''}
            <p class="step-text">${escapeHtml(step.content)}</p>
        </div>
        <div id="area-priv-${i}">${step.myPrivateNote ? renderNoteElement(privNoteText, i, true) : ''}</div>
        <div id="area-group-${i}">${step.myGroupNote ? renderNoteElement(groupNoteText, i, false) : ''}</div>
        
        ${window.currentGroupId && step.othersGroupNotes?.length ? `
            <div style="margin: 20px 30px; padding: 12px; background: #f8f9fa; border-radius:12px; border:1px solid #eee;">
                <p style="margin:0 0 8px 0; font-size:13px; font-weight:bold; color:#7c8a98;">Советы участников:</p>
                ${step.othersGroupNotes.map((n) => `
                    <p style="font-size:14px; margin:4px 0;"><b>${escapeHtml(n.authorName)}:</b> ${escapeHtml(n.text)}</p>
                `).join('')}
            </div>` : ''}
    </div>`;
}

function renderNoteElement(note, index, isPrivate) {
    const color = isPrivate ? '#FFF9C4' : '#E8F5E9';
    return `
        <div class="note-wrapper" style="background: ${color}; margin: 20px 30px;">
            <button class="note-control-btn btn-delete" onclick="deleteNote(${index}, ${isPrivate})" title="Удалить">
                ${renderIcon('plus', 'icon-close note-delete-icon')}
            </button>
            <textarea 
                class="note-paper" 
                style="background: ${color};"
                placeholder="Напишите здесь..."
                oninput="autoResizeNote(this)"
                onblur="saveNote('${window.currentRecipeData.steps[index].id}', this.value, ${isPrivate})">${note}</textarea>
        </div>`;
}