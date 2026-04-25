const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

async function uploadMedia(file) {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    if (!res.ok) throw new Error('Ошибка загрузки фото');
    const data = await res.json();
    return data.url || data.path;
}


function renderDeleteIcon() {
    return window.AppIcons?.render?.('delete', 'icon-btn__icon') || '🗑';
}

function updateImageStatusUI(container, hasImage) {
    if (!container) return;
    const uploadBtn = container.querySelector('[data-action*="upload-"]');
    const deleteBtn = container.querySelector('[data-action*="clear-"]');
    const statusSpan = container.closest('.create-step__media').querySelector('.create-file-name');

    if (hasImage) {
        if (uploadBtn) uploadBtn.textContent = "Изменить фото";
        if (deleteBtn) deleteBtn.classList.remove('is-hidden');
    } else {
        if (uploadBtn) uploadBtn.textContent = "Загрузить фото";
        if (deleteBtn) deleteBtn.classList.add('is-hidden');
        if (statusSpan) {
            statusSpan.textContent = "Нет фото";
            statusSpan.dataset.currentUrl = "";
        }
    }
}

// --- Генерация HTML ---
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

// --- Логика страницы ---

export async function initCreatePage(params) {
    const root = document.getElementById('content-root');
    if (!root) return;

    const editId = params?.get('editId');
    const groupId = params?.get('groupId');

    renderLayout(root, !!groupId, editId);

    if (editId) {
        const res = await fetch(`/api/recipes/${editId}`, { credentials: 'include' });
        const data = await res.json();
        fillFormWithData(root, data);
    }

    setupEventListeners(root, !!groupId, groupId, editId);
}

function renderLayout(root, isGroupContext, editId) {
    root.innerHTML = `
        <section class="create-page">
            <h1 class="create-page__title">${editId ? 'Редактировать рецепт' : (isGroupContext ? 'Рецепт для группы' : 'Создать рецепт')}</h1>
            <form class="create-form" novalidate>
                <section class="create-block">
                    <input class="create-input" type="text" placeholder="Название рецепта" data-field="title" />
                    <input class="create-input" type="number" placeholder="Время (мин)" data-field="cook-time" />
                    <p style="font-size: 12px; color: #7c8a98; margin: -5px 0 10px 15px;">Введите время приготовления (в минутах)</p>
                    
                    <input class="create-input" type="text" placeholder="Теги (через запятую: завтрак, ПП, быстро)" data-field="tags" />
                    <p style="font-size: 12px; color: #7c8a98; margin: -5px 0 15px 15px;">Введите теги через запятую, например: завтрак, обед, острое</p>

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
        root.querySelector('[data-field="tags"]').value = data.tags.join(', ');
    }

    if (data.mainImage) {
        const container = root.querySelector('[data-role="image-container"]');
        const span = root.querySelector('[data-role="cover-file-name"]');
        span.textContent = "Обложка сохранена";
        span.dataset.currentUrl = data.mainImage;
        updateImageStatusUI(container, true);
    }

    const secCont = root.querySelector('[data-role="sections"]');
    const stepCont = root.querySelector('[data-role="steps"]');
    secCont.innerHTML = ""; stepCont.innerHTML = "";

    const groups = data.ingredients.reduce((acc, ing) => {
        const s = ing.section || "Основные";
        if (!acc[s]) acc[s] = [];
        acc[s].push(ing);
        return acc;
    }, {});

    Object.entries(groups).forEach(([name, ings]) => secCont.insertAdjacentHTML('beforeend', createSectionHtml(name, ings)));
    data.steps.forEach(s => stepCont.insertAdjacentHTML('beforeend', createStepHtml(s)));
}

function setupEventListeners(root, isGroupContext, groupId, editId) {
    const form = root.querySelector('.create-form');
    const statusEl = form.querySelector('[data-role="status"]');

    const onPaste = async (e) => {
        const file = e.clipboardData.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const active = document.activeElement;
        const stepBlock = active.closest('[data-role="step"]');
        let container, input, span;

        if (stepBlock) {
            container = stepBlock.querySelector('[data-role="image-container"]');
            input = stepBlock.querySelector('[data-role="step-file-input"]');
            span = stepBlock.querySelector('[data-role="step-file-name"]');
        } else {
            container = form.querySelector('[data-role="image-container"]');
            input = form.querySelector('[data-role="cover-input"]');
            span = form.querySelector('[data-role="cover-file-name"]');
        }

        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        span.textContent = "Вставлено: " + file.name;
        updateImageStatusUI(container, true);
    };

    document.addEventListener('paste', onPaste);

    form.addEventListener('click', (e) => handleFormClicks(e, form, editId));

    form.addEventListener('change', (e) => {
        const input = e.target;
        if (input.type === 'file') {
            const mediaBlock = input.closest('.create-step__media');
            const container = mediaBlock.querySelector('[data-role="image-container"]');
            const span = mediaBlock.querySelector('.create-file-name');
            if (input.files[0]) {
                span.textContent = input.files[0].name;
                updateImageStatusUI(container, true);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit(form, statusEl, isGroupContext, groupId, editId);
    });
}

function handleFormClicks(e, form, editId) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    // Загрузка
    if (action.startsWith('upload-')) {
        const input = btn.closest('.create-step__media').querySelector('input[type="file"]');
        input.click();
        return;
    }

    // Очистка
    if (action.startsWith('clear-')) {
        const mediaBlock = btn.closest('.create-step__media');
        const container = mediaBlock.querySelector('[data-role="image-container"]');
        const input = mediaBlock.querySelector('input[type="file"]');
        input.value = "";
        updateImageStatusUI(container, false);
        return;
    }

    if (action === 'delete-recipe') {
        if (confirm("Удалить этот рецепт?")) {
            fetch(`/api/recipes/${editId}`, { method: 'DELETE', credentials: 'include' })
                .then(res => res.ok && window.AppRouter.navigate('/main'));
        }
        return;
    }

    if (action === 'inc-servings' || action === 'dec-servings') {
        const inp = form.querySelector('[data-role="servings-value"]');
        let val = parseInt(inp.value) || 1;
        inp.value = action === 'inc-servings' ? Math.min(val + 1, 99) : Math.max(val - 1, 1);
    }
    if (action === 'add-section') form.querySelector('[data-role="sections"]').insertAdjacentHTML('beforeend', createSectionHtml());
    if (action === 'add-step') form.querySelector('[data-role="steps"]').insertAdjacentHTML('beforeend', createStepHtml());
    if (action === 'remove-section') btn.closest('[data-role="section"]').remove();
    if (action === 'remove-step') btn.closest('[data-role="step"]').remove();
    if (action === 'add-ingredient') btn.closest('[data-role="section"]').querySelector('[data-role="ingredients"]').insertAdjacentHTML('beforeend', createIngredientRowHtml());
    if (action === 'remove-ingredient') btn.closest('[data-role="ingredient-row"]').remove();
}

async function deleteRecipe(id) {
    if (!confirm("Вы действительно хотите удалить этот рецепт? Это действие нельзя отменить.")) {
        return;
    }

    try {
        const res = await fetch(`/api/recipes/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            window.AppRouter.navigate('/main');
        } else {
            alert("Ошибка при удалении рецепта.");
        }
    } catch (e) {
        console.error(e);
    }
}

function handleFormChanges(e, form) {
    if (e.target.matches('[data-role="cover-input"]')) {
        form.querySelector('[data-role="cover-file-name"]').textContent = e.target.files[0]?.name;
    }
    if (e.target.matches('[data-role="step-file-input"]')) {
        e.target.closest('[data-role="step"]').querySelector('[data-role="step-file-name"]').textContent = e.target.files[0]?.name;
    }
}

async function handleFormSubmit(form, statusEl, isGroupContext, groupId, editId) {
    const submitBtn = form.querySelector('.create-btn--submit');
    submitBtn.disabled = true;
    statusEl.textContent = 'Сохранение...';

    try {
        const coverInput = form.querySelector('[data-role="cover-input"]');
        const oldCoverUrl = form.querySelector('[data-role="cover-file-name"]').dataset.currentUrl || "";
        const mainImageUrl = coverInput.files[0] ? await uploadMedia(coverInput.files[0]) : oldCoverUrl;

        const tagsRaw = form.querySelector('[data-field="tags"]').value;
        let tagsArray = tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);

        if (tagsArray.length === 0) tagsArray.push("Общее");

        const payload = {
            title: form.querySelector('[data-field="title"]').value.trim() || "Без названия",
            mainImage: mainImageUrl,
            isPrivate: isGroupContext ? true : (form.querySelector('[data-field="is-private"]')?.value === 'true'),
            timeMinutes: parseInt(form.querySelector('[data-field="cook-time"]').value) || 1,
            basePortions: parseInt(form.querySelector('[data-role="servings-value"]').value) || 1,
            ingredients: collectIngredients(form),
            tags: tagsArray,
            steps: await collectSteps(form)
        };

        const res = await fetch(editId ? `/api/recipes/${editId}` : '/api/recipes', {
            method: editId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (res.ok) {
            statusEl.textContent = '✅ Готово';
            setTimeout(() => window.AppRouter.navigate('/main'), 1000);
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
                    amount: parseFloat(row.querySelector('[data-field="amount"]').value) || 0,
                    measure: row.querySelector('[data-field="unit"]').value || "",
                    section: secName,
                    sortOrder: sIdx * 100 + rIdx
                });
            }
        });
    });
    return ingredients;
}

function clearFileInput(role, form, stepEl = null) {
    const root = stepEl || form;
    const input = root.querySelector(`[data-role="${role}-file-input"]`);
    const nameSpan = root.querySelector(`[data-role="${role}-file-name"]`);
    if (input) input.value = "";
    if (nameSpan) {
        nameSpan.textContent = "Фото удалено";
        nameSpan.dataset.currentUrl = "";
    }
}

async function collectSteps(form) {
    const steps = [];
    const blocks = form.querySelectorAll('[data-role="step"]');
    for (let i = 0; i < blocks.length; i++) {
        const content = blocks[i].querySelector('[data-field="description"]').value.trim();
        if (!content) continue;

        const file = blocks[i].querySelector('[data-role="step-file-input"]').files[0];
        const oldUrl = blocks[i].querySelector('[data-role="step-file-name"]').dataset.currentUrl || "";

        const mediaUrl = file ? await uploadMedia(file) : oldUrl;

        steps.push({
            content,
            mediaUrl,
            sortOrder: i + 1,
            mediaType: mediaUrl ? "image" : ""
        });
    }
    return steps;
}