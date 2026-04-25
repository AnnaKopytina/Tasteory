import { RECIPE_FILTERS } from '../../core/recipe-filters.js';

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

let selectedTags = new Set();

async function uploadMedia(file) {
    if (!file) {
        return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error('Ошибка загрузки фото');
    }
    const data = await res.json();
    return data.url || data.path;
}

function renderDeleteIcon() {
    return window.AppIcons?.render?.('delete', 'icon-btn__icon') || '🗑';
}

function updateImageStatusUI(container, hasImage) {
    if (!container) {
        return;
    }
    const uploadBtn = container.querySelector('[data-action*="upload-"]');
    const deleteBtn = container.querySelector('[data-action*="clear-"]');
    const statusSpan = container.closest('.create-step__media')?.querySelector('.create-file-name');

    if (hasImage) {
        if (uploadBtn) {
            uploadBtn.textContent = "Изменить фото";
        }
        if (deleteBtn) {
            deleteBtn.classList.remove('is-hidden');
        }
    } else {
        if (uploadBtn) {
            uploadBtn.textContent = "Загрузить фото";
        }
        if (deleteBtn) {
            deleteBtn.classList.add('is-hidden');
        }
        if (statusSpan) {
            statusSpan.textContent = "Нет фото";
            statusSpan.dataset.currentUrl = "";
        }
    }
}

function renderActiveTags(container) {
    container.innerHTML = Array.from(selectedTags).map(tagId => {
        const label = RECIPE_FILTERS.find(f => f.id === tagId)?.label || tagId;
        return `
            <div class="tag-chip" style="display: inline-flex; align-items: center; background: #e9eef2; padding: 5px 12px; border-radius: 20px; font-size: 14px; gap: 8px; color: #102e3f;">
                ${label}
                <span data-action="remove-tag" data-id="${tagId}" style="cursor: pointer; font-weight: bold; color: #f28c50;">&times;</span>
            </div>
        `;
    }).join('');
}

function createIngredientRowHtml(ing = null) {
    return `
        <div class="create-row create-ingredient-row" data-role="ingredient-row">
            <input class="create-input" type="text" placeholder="Ингредиент" data-field="name" value="${ing?.name || ''}" />
            <input class="create-input create-input--small" type="number" step="0.1" placeholder="Кол-во" data-field="amount" value="${ing?.amount || ''}" />
            <input class="create-input create-input--small" type="text" placeholder="Мера" data-field="unit" value="${ing?.measure || ''}" />
            <button class="icon-btn" type="button" data-action="remove-ingredient">${renderDeleteIcon()}</button>
        </div>
    `;
}

function createSectionHtml(name = "", ings = []) {
    const rows = ings.length > 0 ? ings.map(i => createIngredientRowHtml(i)).join('') : createIngredientRowHtml();
    return `
        <article class="create-section" data-role="section">
            <div class="create-section__head">
                <input class="create-input" type="text" placeholder="Название секции" data-field="section-name" value="${name}" />
                <button class="icon-btn" type="button" data-action="remove-section">${renderDeleteIcon()}</button>
            </div>
            <div class="create-ingredients" data-role="ingredients">${rows}</div>
            <button class="create-btn create-btn--small" type="button" data-action="add-ingredient">+ Ингредиент</button>
        </article>
    `;
}

function createStepHtml(step = null) {
    return `
        <article class="create-step" data-role="step">
            <div class="create-step__head">
                <textarea class="create-input create-textarea" rows="3" placeholder="Описание шага" data-field="description">${step?.content || ''}</textarea>
                <button class="icon-btn" type="button" data-action="remove-step">${renderDeleteIcon()}</button>
            </div>
            <div class="create-step__media">
                <div class="create-image-actions" data-role="image-container">
                    <button class="create-btn create-btn--small" type="button" data-action="upload-step-photo">
                        ${step?.mediaUrl ? 'Изменить фото' : 'Загрузить фото'}
                    </button>
                    <button class="create-btn create-btn--small ${step?.mediaUrl ? '' : 'is-hidden'}" type="button" data-action="clear-step-photo" style="background:#7c8a98">
                        Удалить фото
                    </button>
                </div>
                <span class="create-file-name" data-role="step-file-name" data-current-url="${step?.mediaUrl || ''}">
                    ${step?.mediaUrl ? 'Фото загружено' : 'Нет фото'}
                </span>
                <input type="file" accept="image/*" class="create-hidden-input" data-role="step-file-input" />
            </div>
        </article>
    `;
}

export async function initCreatePage(params) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    const editId = params?.get('editId');
    const groupId = params?.get('groupId');
    
    selectedTags.clear();

    renderLayout(root, !!groupId, editId);

    if (editId) {
        await loadRecipeForEdit(root, editId);
    }

    setupEventListeners(root, !!groupId, groupId, editId);
}

async function loadRecipeForEdit(root, editId) {
    try {
        const res = await fetch(`/api/recipes/${editId}`, { credentials: 'include' });
        const data = await res.json();
        fillFormWithData(root, data);
    } catch (e) {
        console.error(e);
    }
}

function renderLayout(root, isGroupContext, editId) {
    root.innerHTML = `
        <section class="create-page">
            <h1 class="create-page__title">${editId ? 'Редактировать рецепт' : (isGroupContext ? 'Рецепт для группы' : 'Создать рецепт')}</h1>
            <form class="create-form" novalidate>
                <section class="create-block">
                    <input class="create-input" type="text" placeholder="Название рецепта" data-field="title" />
                    <input class="create-input" type="number" placeholder="Время (мин)" data-field="cook-time" />
                    
                    <div class="create-tags-section" style="margin: 10px 0 20px 0;">
                        <p style="font-size: 14px; font-weight: 600; color: #4a5f70; margin-bottom: 8px;">Категории</p>
                        <div id="selected-tags-container" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;"></div>
                        
                        <div style="position: relative; display: inline-block;">
                            <button type="button" class="create-btn create-btn--small" data-action="toggle-tags-popup">+ Категория</button>
                            <div id="tags-popup" class="is-hidden" style="position: absolute; top: 100%; left: 0; background: white; border: 1px solid #d8dde4; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 10; padding: 10px; width: 200px; display: grid; gap: 4px; margin-top: 5px;">
                                ${RECIPE_FILTERS.map(f => `
                                    <button type="button" data-action="add-tag" data-id="${f.id}" class="group-page__menu-item" style="padding: 8px; font-size: 14px; border-radius: 6px;">${f.label}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="create-row create-row--split" style="align-items: flex-start;">
                        <div class="create-step__media" style="flex-grow:1; background:none; padding:0; border:none;">
                            <div class="create-image-actions" data-role="image-container">
                                <button class="create-btn create-btn--small" type="button" data-action="upload-cover-photo">Загрузить фото</button>
                                <button class="create-btn create-btn--small is-hidden" type="button" data-action="clear-cover-photo" style="background:#7c8a98">Удалить фото</button>
                            </div>
                            <span class="create-file-name" data-role="cover-file-name" data-current-url="">Нет фото</span>
                            <input type="file" accept="image/*" class="create-hidden-input" data-role="cover-input" />
                        </div>
                        
                        <div style="${isGroupContext ? 'display:none' : ''}">
                            <select class="create-input" data-field="is-private">
                                <option value="false">Публичный</option>
                                <option value="true">Приватный</option>
                            </select>
                        </div>
                        ${isGroupContext ? '<div class="create-input" style="background:#f5f5f5; display:flex; align-items:center; color:#666; height:45px">🔒 Групповой</div>' : ''}
                    </div>
                </section>

                <section class="create-block">
                    <h2 class="create-block__title">Ингредиенты</h2>
                    <div class="create-servings">
                        <span>Количество порций:</span>
                        <div class="create-counter">
                            <button type="button" data-action="dec-servings">-</button>
                            <input type="number" value="1" data-role="servings-value" readonly />
                            <button type="button" data-action="inc-servings">+</button>
                        </div>
                    </div>
                    <div class="create-sections" data-role="sections"></div>
                    <button class="create-btn create-btn--center" type="button" data-action="add-section">+ Секция</button>
                </section>

                <section class="create-block">
                    <h2 class="create-block__title">Шаги</h2>
                    <div class="create-steps" data-role="steps"></div>
                    <button class="create-btn create-btn--center" type="button" data-action="add-step">+ Шаг</button>
                </section>

                <div class="create-actions" style="display:flex; flex-direction:column; gap:10px;">
                    <button class="create-btn create-btn--submit" type="submit">${editId ? 'Сохранить изменения' : 'Создать'}</button>
                    ${editId ? `<button class="create-btn" type="button" data-action="delete-recipe" style="background:#f28c50">Удалить рецепт</button>` : ''}
                </div>
                <p class="create-status" data-role="status" style="text-align:center; font-weight:bold; margin-top:15px;"></p>
            </form>
        </section>
    `;

    if (!editId) {
        root.querySelector('[data-role="sections"]').insertAdjacentHTML('beforeend', createSectionHtml());
        root.querySelector('[data-role="steps"]').insertAdjacentHTML('beforeend', createStepHtml());
    }
}

function fillFormWithData(root, data) {
    root.querySelector('[data-field="title"]').value = data.title;
    root.querySelector('[data-field="cook-time"]').value = data.timeMinutes;
    root.querySelector('[data-role="servings-value"]').value = data.basePortions;

    if (data.tags) {
        data.tags
            .filter(t => t.toLowerCase() !== "общее")
            .forEach(t => selectedTags.add(t.toLowerCase()));
        renderActiveTags(root.querySelector('#selected-tags-container'));
    }

    if (data.mainImage) {
        const container = root.querySelector('[data-role="image-container"]');
        const span = root.querySelector('[data-role="cover-file-name"]');
        span.textContent = "Обложка сохранена";
        span.dataset.currentUrl = data.mainImage;
        updateImageStatusUI(container, true);
    }

    fillIngredientsAndSteps(root, data);
}

function fillIngredientsAndSteps(root, data) {
    const secCont = root.querySelector('[data-role="sections"]');
    const stepCont = root.querySelector('[data-role="steps"]');
    secCont.innerHTML = ""; 
    stepCont.innerHTML = "";

    const groups = data.ingredients.reduce((acc, ing) => {
        const s = ing.section || "Основные";
        if (!acc[s]) {
            acc[s] = [];
        }
        acc[s].push(ing);
        return acc;
    }, {});

    Object.entries(groups).forEach(([name, ings]) => {
        secCont.insertAdjacentHTML('beforeend', createSectionHtml(name, ings));
    });
    data.steps.forEach(s => {
        stepCont.insertAdjacentHTML('beforeend', createStepHtml(s));
    });
}

function setupEventListeners(root, isGroupContext, groupId, editId) {
    const form = root.querySelector('.create-form');

    form.addEventListener('click', async (e) => {
        await handleFormClick(e, root, form, editId);
    });

    form.addEventListener('change', (e) => {
        handleFormChange(e);
    });

    form.addEventListener('submit', async (e) => {
        await handleFormSubmit(e, form, isGroupContext, groupId, editId);
    });
}

async function handleFormClick(e, root, form, editId) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
        return;
    }
    const action = btn.dataset.action;
    const tagsContainer = root.querySelector('#selected-tags-container');
    const tagsPopup = root.querySelector('#tags-popup');

    if (action === 'toggle-tags-popup') {
        tagsPopup.classList.toggle('is-hidden');
        return;
    }
    if (action === 'add-tag') {
        selectedTags.add(btn.dataset.id);
        renderActiveTags(tagsContainer);
        tagsPopup.classList.add('is-hidden');
        return;
    }
    if (action === 'remove-tag') {
        selectedTags.delete(btn.dataset.id);
        renderActiveTags(tagsContainer);
        return;
    }
    if (action.startsWith('upload-')) {
        btn.closest('.create-step__media, .create-row').querySelector('input[type="file"]').click();
        return;
    }
    if (action.startsWith('clear-')) {
        const mediaBlock = btn.closest('.create-step__media, .create-row');
        mediaBlock.querySelector('input[type="file"]').value = "";
        updateImageStatusUI(mediaBlock.querySelector('[data-role="image-container"]'), false);
        return;
    }
    if (action === 'inc-servings' || action === 'dec-servings') {
        const inp = form.querySelector('[data-role="servings-value"]');
        let val = parseInt(inp.value) || 1;
        inp.value = action === 'inc-servings' ? Math.min(val + 1, 99) : Math.max(val - 1, 1);
    }
    if (action === 'add-section') {
        root.querySelector('[data-role="sections"]').insertAdjacentHTML('beforeend', createSectionHtml());
    }
    if (action === 'add-step') {
        root.querySelector('[data-role="steps"]').insertAdjacentHTML('beforeend', createStepHtml());
    }
    if (action === 'remove-section') {
        btn.closest('[data-role="section"]').remove();
    }
    if (action === 'remove-step') {
        btn.closest('[data-role="step"]').remove();
    }
    if (action === 'add-ingredient') {
        btn.closest('[data-role="section"]').querySelector('[data-role="ingredients"]').insertAdjacentHTML('beforeend', createIngredientRowHtml());
    }
    if (action === 'remove-ingredient') {
        btn.closest('[data-role="ingredient-row"]').remove();
    }
    if (action === 'delete-recipe') {
        if (confirm("Удалить рецепт навсегда?")) {
            const res = await fetch(`/api/recipes/${editId}`, { method: 'DELETE', credentials: 'include' });
            if (res.ok) {
                window.AppRouter.navigate('/main');
            }
        }
    }
}

function handleFormChange(e) {
    if (e.target.type === 'file') {
        const mediaBlock = e.target.closest('.create-block, .create-step__media');
        if (e.target.files[0]) {
            mediaBlock.querySelector('.create-file-name').textContent = e.target.files[0].name;
            updateImageStatusUI(mediaBlock.querySelector('[data-role="image-container"]'), true);
        }
    }
}

async function handleFormSubmit(e, form, isGroupContext, groupId, editId) {
    e.preventDefault();
    const statusEl = form.querySelector('[data-role="status"]');
    const submitBtn = form.querySelector('.create-btn--submit');
    submitBtn.disabled = true;
    statusEl.textContent = 'Сохранение...';

    try {
        const coverInput = form.querySelector('[data-role="cover-input"]');
        const oldCoverUrl = form.querySelector('[data-role="cover-file-name"]').dataset.currentUrl || "";
        const mainImageUrl = coverInput.files[0] ? await uploadMedia(coverInput.files[0]) : oldCoverUrl;

        const tagsArray = Array.from(selectedTags);
        const finalTags = tagsArray.length > 0 ? tagsArray : ["общее"];

        const payload = {
            title: form.querySelector('[data-field="title"]').value.trim(),
            mainImage: mainImageUrl,
            mainText: "Описание",
            isPrivate: isGroupContext ? true : (form.querySelector('[data-field="is-private"]')?.value === 'true'),
            timeMinutes: parseInt(form.querySelector('[data-field="cook-time"]').value) || 1,
            basePortions: parseInt(form.querySelector('[data-role="servings-value"]').value) || 1,
            ingredients: collectIngredients(form),
            tags: finalTags,
            steps: await collectSteps(form)
        };

        const res = await fetch(editId ? `/api/recipes/${editId}` : '/api/recipes', {
            method: editId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (res.ok) {
            const created = await res.json().catch(() => ({}));
            if (!editId && isGroupContext && created.id) {
                await fetch(`/api/groups/${groupId}/recipes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(created.id), credentials: 'include' });
            }
            statusEl.textContent = '✅ Готово';
            setTimeout(() => window.AppRouter.navigate(isGroupContext ? `/group/${groupId}` : '/main'), 1000);
        } else {
            statusEl.textContent = '❌ Ошибка сервера';
            submitBtn.disabled = false;
        }
    } catch (err) {
        statusEl.textContent = '❌ Ошибка сети';
        submitBtn.disabled = false;
    }
}

function collectIngredients(form) {
    const ingredients = [];
    form.querySelectorAll('[data-role="section"]').forEach((sec, sIdx) => {
        const secName = sec.querySelector('[data-field="section-name"]').value || "Основные";
        sec.querySelectorAll('[data-role="ingredient-row"]').forEach((row, rIdx) => {
            const name = row.querySelector('[data-field="name"]').value.trim();
            if (name) {
                ingredients.push({
                    name,
                    amount: parseFloat(row.querySelector('[data-field="amount"]').value) || 0.1,
                    measure: row.querySelector('[data-field="unit"]').value || "",
                    section: secName,
                    sortOrder: sIdx * 100 + rIdx + 1
                });
            }
        });
    });
    return ingredients;
}

async function collectSteps(form) {
    const steps = [];
    const blocks = form.querySelectorAll('[data-role="step"]');
    for (let i = 0; i < blocks.length; i++) {
        const content = blocks[i].querySelector('[data-field="description"]').value.trim();
        if (!content) {
            continue;
        }
        const file = blocks[i].querySelector('input[type="file"]').files[0];
        const oldUrl = blocks[i].querySelector('.create-file-name').dataset.currentUrl || "";
        const url = file ? await uploadMedia(file) : oldUrl;
        steps.push({ content, mediaUrl: url, sortOrder: i + 1, mediaType: url ? "image" : "" });
    }
    return steps;
}