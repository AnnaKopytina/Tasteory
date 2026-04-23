import {DataStore} from '../../services/data-store.js';

let currentRecipeData = null;

function getCurrentRecipe() {
    return currentRecipeData;
}

function renderIcon(name, className = '') {
    return window.AppIcons?.render?.(name, className)
        || window.AppIcons?.renderIcon?.(name, className)
        || '';
}

export function initRecipePage(id) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    const data = DataStore.getRecipeDetails(id);
    if (!data) {
        root.innerHTML = '<section class="recipe-inner"><div class="page-card"><h1>Рецепт не найден</h1></div></section>';
        return;
    }

    currentRecipeData = data;

    loadNotesFromStorage(data);

    root.innerHTML = `
        <div class="recipe-inner">
            <div class="page-card">
                <div class="recipe-header">
                    <div class="recipe-header-left">
                        <h1 class="recipe-title">${data.title}</h1>
                        <p class="recipe-meta-author">Автор <span>${data.author}</span></p>
                    </div>

                    <button class="favorite-btn ${data.isFavorite ? 'active' : ''}" onclick="toggleFavorite()" aria-pressed="${data.isFavorite}" title="Добавить в избранное">
                        <span class="favorite-icon" aria-hidden="true">
                            ${renderIcon('bookmark', 'icon-bookmark recipe-bookmark-icon')}
                        </span>
                    </button>
                </div>

                <div class="recipe-image">
                    <img src="${data.mainImage}" alt="${data.title}">
                </div>

                <div class="recipe-badges">
                    <div class="recipe-badge">
                        <span class="recipe-badge__icon" aria-hidden="true">${renderIcon('favoritesSmall', 'recipe-badge__svg')}</span>
                        <span>${data.peopleCount} человек</span>
                    </div>
                    <span class="recipe-dot-divider" aria-hidden="true">${renderIcon('separator', 'recipe-dot-divider__svg')}</span>
                    <div class="recipe-badge">
                        <span class="recipe-badge__icon" aria-hidden="true">${renderIcon('timeCircle', 'recipe-badge__svg recipe-badge__svg--time')}</span>
                        <span>${data.time} Мин</span>
                    </div>
                </div>
            </div>

            <div class="page-card">
                <div class="ingredients-block">
                    <div class="ingredients-header">
                        <h2>Ингредиенты <span class="ing-count">${countTotalIngredients(data)}</span></h2>
                        <div class="counter-rigth">
                            <span>Порций:</span>
                            <div class="servings-counter">
                                <button onclick="changeServings(-1)" aria-label="Уменьшить порции">-</button>
                                <input type="number" value="${data.currentServings}" readonly>
                                <button onclick="changeServings(1)" aria-label="Увеличить порции">+</button>
                            </div>
                        </div>
                    </div>

                    <div class="ingredients-list">
                        ${renderIngredients(data)}
                    </div>
                </div>
            </div>

            <div class="page-card">
                <!-- STEPS -->
                <div class="steps-block">
                    <h2 class="section-title">Как приготовить?</h2>
                    <div class="steps-list">
                        ${renderSteps(data)}
                    </div>
                </div>
            </div>
        </div>
    `;

    syncAllNoteHeights();
}

function loadNotesFromStorage(data) {
    const storageKey = `recipe_notes_${data.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            const notesData = JSON.parse(saved);
            data.steps.forEach((step, index) => {
                if (notesData[index] !== undefined) {
                    step.note = notesData[index];
                }
            });
        } catch (e) {
            console.error('Ошибка при загрузке заметок:', e);
        }
    }
}

function saveNoteToStorage(recipeId, stepIndex, noteText) {
    const storageKey = `recipe_notes_${recipeId}`;
    const saved = localStorage.getItem(storageKey);
    let notesData = {};

    if (saved) {
        try {
            notesData = JSON.parse(saved);
        } catch (e) {
            console.error('Ошибка при чтении заметок:', e);
        }
    }

    if (noteText === null || noteText === '') {
        delete notesData[stepIndex];
    } else {
        notesData[stepIndex] = noteText;
    }

    localStorage.setItem(storageKey, JSON.stringify(notesData));
}

function countTotalIngredients(data) {
    return data.ingredientsGroups.reduce((acc, g) => acc + g.items.length, 0);
}

function renderIngredients(data) {
    return data.ingredientsGroups.map((group, i) => {
        const isOpen = group.isOpen !== false;

        return `
        <div class="ing-group">
            <div class="ing-group-header">
                <span>${group.name}</span>
                <button onclick="watchIng(${i})">
                        <span aria-hidden="true" class="arrow-icon ${isOpen ? 'active' : ''}">${renderIcon('pointer', 'arrow-icon__svg')}</span>
                </button>
            </div>
            <ul class="ing-items ${isOpen ? '' : 'hidden'}">
                ${group.items.map(item => {
            const amount = (item.count / data.baseServings) * data.currentServings;
            return `
                        <li>
                            <span class="name">${item.name}</span>
                            <span class="dots"></span>
                            <span class="val">${parseFloat(amount.toFixed(1))} ${item.measure}</span>
                        </li>
                    `;
        }).join('')}
            </ul>
        </div>
    `}).join('');
}

function watchIng(index) {
    const data = getCurrentRecipe();
    if (!data) {
        return;
    }

    const groups = document.querySelectorAll('.ing-group');
    const targetGroup = groups[index];
    if (!targetGroup) return;

    const list = targetGroup.querySelector('.ing-items');
    const arrow = targetGroup.querySelector('.arrow-icon');
    list.classList.toggle('hidden');
    arrow.classList.toggle('active');
    data.ingredientsGroups[index].isOpen = !list.classList.contains('hidden');
}

function changeServings(delta) {
    const data = getCurrentRecipe();
    if (!data) {
        return;
    }

    const newVal = data.currentServings + delta;
    if (newVal >= 1 && newVal <= 20) {
        data.currentServings = newVal;
        initRecipePage(data.id);
    }
}

function toggleFavorite() {
    const data = getCurrentRecipe();
    if (!data) {
        return;
    }

    const nextFavorite = !data.isFavorite;
    DataStore.setRecipeFavorite(data.id, nextFavorite);
    data.isFavorite = nextFavorite;
    initRecipePage(data.id);
}

/* ШАГИ */

function renderSteps(data) {
    return data.steps.map((step, i) => {
        const hasText = !!step.text;
        const hasMedia = !!step.media;

        let layoutClass = "step-content";
        if (hasText && hasMedia)
            layoutClass += " grid-cols";
        else if (!hasText && hasMedia)
            layoutClass += " full-media";

        return `
        <div class="step-card" id="step-${i}">
            <div class="step-card__header">
                <h3>Шаг ${step.number}</h3>
                <div class="note-action" id="note-action-${i}">
                    ${renderAddNoteButton(step.note, i)}
                </div>
            </div>
            <div class="${layoutClass}">
                ${hasMedia ? `<img src="${step.media.url}" alt="Иллюстрация шага ${step.number}" class="step-img">` : ''}
                ${hasText ? `<p class="step-text">${step.text}</p>` : ''}
            </div>
            <div class="note-area" id="note-area-${i}">
                ${step.note !== null ? renderNoteElement(step.note, i) : ''}
            </div>
        </div>
        `;
    }).join('');
}

function renderAddNoteButton(note, index) {
    if (note !== null) {
        return '';
    }

    return `
        <button class="add-note-btn" onclick="addNote(${index})">
            <span class="add-note-btn__icon" aria-hidden="true">${renderIcon('plus', 'add-note-btn__icon-svg')}</span>
            <span>Добавить заметку</span>
        </button>
    `;
}

function renderNoteElement(note, index) {
    return `
        <div class="note-wrapper">
            <!-- Кнопка удаления -->
            <button class="note-control-btn btn-delete" onclick="deleteNote(${index})" title="Удалить">
                ${renderIcon('plus', 'icon-close note-delete-icon')}
            </button>
            
            <!-- заметка -->
            <textarea 
                id="note-input-${index}"
                class="note-paper"
                placeholder="Напишите здесь вашу заметку..."
                oninput="handleNoteInput(${index}, this)">${note && note !== 'Напишите здесь вашу заметку...' ? note : ''}
            </textarea>
        </div>
    `;
}

function autoResizeNote(textarea) {
    if (!textarea) {
        return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function syncAllNoteHeights() {
    document.querySelectorAll('.note-paper').forEach((textarea) => {
        autoResizeNote(textarea);
    });
}

/* ИНТЕРАКТИВА С ЗАМЕТКОЙ*/
function addNote(index) {
    const data = getCurrentRecipe();
    if (!data) {
        return;
    }

    data.steps[index].note = "";
    saveNoteToStorage(data.id, index, "");
    const action = document.getElementById(`note-action-${index}`);
    const area = document.getElementById(`note-area-${index}`);
    if (action) {
        action.innerHTML = '';
    }
    area.innerHTML = renderNoteElement(data.steps[index].note, index);
    const textarea = area.querySelector('.note-paper');
    autoResizeNote(textarea);
    textarea.focus();
}

function deleteNote(index) {
    const data = getCurrentRecipe();
    if (!data) {
        return;
    }

    data.steps[index].note = null;
    saveNoteToStorage(data.id, index, null);
    const action = document.getElementById(`note-action-${index}`);
    if (action) {
        action.innerHTML = renderAddNoteButton(null, index);
    }
    document.getElementById(`note-area-${index}`).innerHTML = '';
    console.log(`Заметка удалена из шага ${index + 1} `);
}

function handleNoteInput(index, textarea) {
    const data = getCurrentRecipe();
    if (!data) {
        return;
    }

    autoResizeNote(textarea);
    data.steps[index].note = textarea.value;
    saveNoteToStorage(data.id, index, textarea.value);
    console.log("Заметка сохранена: ", textarea.value);
}

Object.assign(window, {
    watchIng,
    changeServings,
    toggleFavorite,
    addNote,
    deleteNote,
    handleNoteInput
});
