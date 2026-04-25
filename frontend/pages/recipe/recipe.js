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

window.saveNote = async function(stepId, text, isPrivate) {
    const gid = window.currentGroupId;
    const trimmed = text.trim();
    try {
        if (!trimmed) {
            await fetch(`/api/notes/step/${stepId}?isPrivate=${isPrivate}${gid ? `&groupId=${gid}` : ''}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        } else {
            await fetch('/api/notes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    stepId,
                    text: trimmed,
                    isPrivate,
                    groupId: isPrivate ? null : gid
                }),
                credentials: 'include'
            });
        }
    } catch (e) {
        console.error(e);
    }
};

window.autoResizeNote = function(textarea) {
    if (!textarea) {
        return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
};

window.changeServings = function(delta) {
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

window.addNote = function(index, isPrivate) {
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

window.deleteNote = async function(index, isPrivate) {
    const step = window.currentRecipeData.steps[index];
    const gid = window.currentGroupId;
    await fetch(`/api/notes/step/${step.id}?isPrivate=${isPrivate}${gid ? `&groupId=${gid}` : ''}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    initRecipePage(new URLSearchParams(window.location.search));
};

window.toggleFavorite = async function() {
    const isAuth = await window.AppRouter.isAuthorized();
    if (!isAuth) {
        alert("Чтобы сохранять рецепты, нужно войти в аккаунт.");
        return;
    }

    const data = window.currentRecipeData;
    const isAdding = !data.isFavorite;
    const res = await fetch(`/api/favorites/${data.id}`, {
        method: isAdding ? 'POST' : 'DELETE',
        credentials: 'include'
    });
    if (res.ok) {
        data.isFavorite = isAdding;
        data.favoritesCount += isAdding ? 1 : -1;
        renderFullPage(document.getElementById('content-root'), data);
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
    const userRes = await fetch('/api/users/me', {
        credentials: 'include'
    });
    if (userRes.ok) {
        const userData = await userRes.json();
        window.currentUserId = String(userData.id).toLowerCase();
    }
}

async function fetchRecipeData(recipeId) {
    const url = `/api/recipes/${recipeId}${window.currentGroupId ? `?groupId=${window.currentGroupId}` : ''}`;
    const res = await fetch(url, {
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error('Рецепт не найден');
    }
    const recipe = await res.json();
    recipe.currentServings = recipe.basePortions;
    return recipe;
}

async function fetchNotesForSteps(recipe) {
    for (let step of recipe.steps) {
        const nUrl = `/api/notes/step/${step.id}${window.currentGroupId ? `?groupId=${window.currentGroupId}` : ''}`;
        const nRes = await fetch(nUrl, {
            credentials: 'include'
        });
        if (nRes.ok) {
            const nData = await nRes.json();
            step.myPrivateNote = nData.myPrivateNote?.text || null;
            const gNotes = nData.groupNotes || [];
            step.myGroupNote = gNotes.find((n) => {
                return String(n.authorId).toLowerCase() === window.currentUserId;
            })?.text || null;
            step.othersGroupNotes = gNotes.filter((n) => {
                return String(n.authorId).toLowerCase() !== window.currentUserId;
            });
        }
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
    document.querySelectorAll('.note-paper').forEach((t) => {
        window.autoResizeNote(t);
    });
}

function renderHeaderCard(data) {
    return `
        <div class="page-card">
            <div class="recipe-header">
                <div class="recipe-header-left">
                    <h1 class="recipe-title">${escapeHtml(data.title)}</h1>
                    <p class="recipe-meta-author">Автор <span>${escapeHtml(data.authorName)}</span></p>
                </div>
                <button class="favorite-btn ${data.isFavorite ? 'active' : ''}" onclick="toggleFavorite()">
                    <span class="favorite-icon">${renderIcon('bookmark', 'recipe-bookmark-icon')}</span>
                </button>
            </div>
            <div class="recipe-image"><img src="${data.mainImage || '/assets/no-photo.png'}"></div>
            <div class="recipe-badges">
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
    return data.steps.sort((a, b) => {
        return a.sortOrder - b.sortOrder;
    }).map((step, i) => {
        return `
        <div class="step-card">
            <div class="step-card__header">
                <h3>Шаг ${step.sortOrder}</h3>
                <div class="note-action" style="display: flex; gap: 12px;">
                    ${step.myPrivateNote === null ? `
                        <button class="add-note-btn" onclick="addNote(${i}, true)">
                            <span class="add-note-btn__icon" aria-hidden="true">${renderIcon('plus', 'add-note-btn__icon-svg')}</span>
                            <span>Добавить заметку</span>
                        </button>` : ''}
                    ${window.currentGroupId && step.myGroupNote === null ? `
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
            <div id="area-priv-${i}">${step.myPrivateNote !== null ? renderNoteElement(step.myPrivateNote, i, true) : ''}</div>
            <div id="area-group-${i}">${step.myGroupNote !== null ? renderNoteElement(step.myGroupNote, i, false) : ''}</div>
            ${window.currentGroupId && step.othersGroupNotes?.length ? `
                <div style="margin: 20px 30px; padding: 12px; background: #f8f9fa; border-radius:12px; border:1px solid #eee;">
                    <p style="margin:0 0 8px 0; font-size:13px; font-weight:bold; color:#7c8a98;">Советы участников:</p>
                    ${step.othersGroupNotes.map((n) => {
                        return `<p style="font-size:14px; margin:4px 0;"><b>${escapeHtml(n.authorName)}:</b> ${escapeHtml(n.text)}</p>`;
                    }).join('')}
                </div>` : ''}
        </div>`;
    }).join('');
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