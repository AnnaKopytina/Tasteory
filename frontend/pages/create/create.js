const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

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

function createIngredientRowHtml() {
    return `
        <div class="create-row create-ingredient-row" data-role="ingredient-row">
            <input class="create-input" type="text" placeholder="Ингредиент" data-field="name" />
            <input class="create-input create-input--small" type="number" step="0.1" placeholder="Кол-во" data-field="amount" />
            <input class="create-input create-input--small" type="text" placeholder="Мера" data-field="unit" />
            <button class="icon-btn" type="button" data-action="remove-ingredient">${renderDeleteIcon()}</button>
        </div>
    `;
}

function createSectionHtml() {
    return `
        <article class="create-section" data-role="section">
            <div class="create-section__head">
                <input class="create-input" type="text" placeholder="Название секции" data-field="section-name" />
                <button class="icon-btn" type="button" data-action="remove-section">${renderDeleteIcon()}</button>
            </div>
            <div class="create-ingredients" data-role="ingredients">${createIngredientRowHtml()}</div>
            <button class="create-btn create-btn--small" type="button" data-action="add-ingredient">+ Ингредиент</button>
        </article>
    `;
}

function createStepHtml() {
    return `
        <article class="create-step" data-role="step">
            <div class="create-step__head">
                <textarea class="create-input create-textarea" rows="3" placeholder="Описание шага" data-field="description"></textarea>
                <button class="icon-btn" type="button" data-action="remove-step">${renderDeleteIcon()}</button>
            </div>
            <div class="create-step__media">
                <button class="create-btn create-btn--small" type="button" data-action="upload-step-photo">Фото</button>
                <span class="create-file-name" data-role="step-file-name">Нет фото</span>
            </div>
            <input type="file" accept="image/*" class="create-hidden-input" data-role="step-file-input" />
        </article>
    `;
}

export function initCreatePage(params) {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    const groupId = params?.get('groupId');
    const isGroupContext = Boolean(groupId);

    renderLayout(root, isGroupContext);
    setupEventListeners(root, isGroupContext, groupId);
}

function renderLayout(root, isGroupContext) {
    root.innerHTML = `
        <section class="create-page">
            <h1 class="create-page__title">${isGroupContext ? 'Рецепт для группы' : 'Создать рецепт'}</h1>
            <form class="create-form" novalidate>
                <section class="create-block">
                    <input class="create-input" type="text" placeholder="Название рецепта" data-field="title" />
                    <input class="create-input" type="number" placeholder="Время (мин)" data-field="cook-time" />
                    <div class="create-row create-row--split">
                        <button class="create-btn" type="button" data-action="upload-cover">Обложка</button>
                        <div style="${isGroupContext ? 'display:none' : ''}">
                            <select class="create-input" data-field="is-private">
                                <option value="false">Публичный</option>
                                <option value="true">Приватный</option>
                            </select>
                        </div>
                        ${isGroupContext ? '<div class="create-input" style="background:#f5f5f5; display:flex; align-items:center; color:#666;">🔒 Групповой (приватный)</div>' : ''}
                    </div>
                    <span class="create-file-name" data-role="cover-file-name">Обложка не выбрана</span>
                    <input type="file" accept="image/*" class="create-hidden-input" data-role="cover-input" />
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
                <button class="create-btn create-btn--submit" type="submit">Создать</button>
                <p class="create-status" data-role="status" style="text-align:center; font-weight:bold;"></p>
            </form>
        </section>
    `;

    const sectionsContainer = root.querySelector('[data-role="sections"]');
    const stepsContainer = root.querySelector('[data-role="steps"]');
    sectionsContainer.insertAdjacentHTML('beforeend', createSectionHtml());
    stepsContainer.insertAdjacentHTML('beforeend', createStepHtml());
}

function setupEventListeners(root, isGroupContext, groupId) {
    const form = root.querySelector('.create-form');
    const statusEl = form.querySelector('[data-role="status"]');

    form.addEventListener('click', (e) => {
        handleFormClicks(e, form);
    });

    form.addEventListener('change', (e) => {
        handleFormChanges(e, form);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit(form, statusEl, isGroupContext, groupId);
    });
}

function handleFormClicks(e, form) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
        return;
    }

    const action = btn.dataset.action;
    const sectionsContainer = form.querySelector('[data-role="sections"]');
    const stepsContainer = form.querySelector('[data-role="steps"]');

    if (action === 'inc-servings') {
        const inp = form.querySelector('[data-role="servings-value"]');
        let val = parseInt(inp.value) || 1;
        if (val < 99) {
            inp.value = val + 1;
        }
        return;
    }

    if (action === 'dec-servings') {
        const inp = form.querySelector('[data-role="servings-value"]');
        let val = parseInt(inp.value) || 1;
        if (val > 1) {
            inp.value = val - 1;
        }
        return;
    }

    if (action === 'upload-cover') {
        form.querySelector('[data-role="cover-input"]').click();
    }
    if (action === 'add-section') {
        sectionsContainer.insertAdjacentHTML('beforeend', createSectionHtml());
    }
    if (action === 'add-step') {
        stepsContainer.insertAdjacentHTML('beforeend', createStepHtml());
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
    if (action === 'upload-step-photo') {
        btn.closest('[data-role="step"]').querySelector('[data-role="step-file-input"]').click();
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

async function handleFormSubmit(form, statusEl, isGroupContext, groupId) {
    statusEl.textContent = 'Публикация...';
    const submitBtn = form.querySelector('.create-btn--submit');
    submitBtn.disabled = true;

    try {
        const coverInput = form.querySelector('[data-role="cover-input"]');
        const mainImageUrl = coverInput.files[0] ? await uploadMedia(coverInput.files[0]) : "";

        const ingredients = collectIngredients(form);
        const steps = await collectSteps(form);

        const payload = {
            title: form.querySelector('[data-field="title"]').value.trim() || "Новый рецепт",
            mainImage: mainImageUrl,
            mainText: "Описание",
            isPrivate: isGroupContext ? true : (form.querySelector('[data-field="is-private"]').value === 'true'),
            timeMinutes: parseInt(form.querySelector('[data-field="cook-time"]').value) || 1,
            basePortions: parseInt(form.querySelector('[data-role="servings-value"]').value) || 1,
            tags: isGroupContext ? ["Группа"] : ["Общее"],
            ingredients,
            steps
        };

        const res = await fetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            if (isGroupContext) {
                await fetch(`/api/groups/${groupId}/recipes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.id),
                    credentials: 'include'
                });
            }
            statusEl.textContent = '✅ Готово!';
            setTimeout(() => {
                window.AppRouter.navigate(isGroupContext ? `/group/${groupId}` : '/main');
            }, 1500);
        } else {
            statusEl.textContent = '❌ Ошибка сервера.';
            submitBtn.disabled = false;
        }
    } catch (err) {
        statusEl.textContent = '❌ Ошибка сети.';
        submitBtn.disabled = false;
    }
}

function collectIngredients(form) {
    const ingredients = [];
    let iCount = 1;
    form.querySelectorAll('[data-role="section"]').forEach((sec) => {
        const secName = sec.querySelector('[data-field="section-name"]').value || "Основные";
        sec.querySelectorAll('[data-role="ingredient-row"]').forEach((row) => {
            const name = row.querySelector('[data-field="name"]').value.trim();
            if (!name) {
                return;
            }
            ingredients.push({
                id: EMPTY_GUID,
                name,
                amount: parseFloat(row.querySelector('[data-field="amount"]').value) || 1,
                measure: row.querySelector('[data-field="unit"]').value || "",
                section: secName,
                sortOrder: iCount++
            });
        });
    });
    return ingredients;
}

async function collectSteps(form) {
    const steps = [];
    const stepBlocks = form.querySelectorAll('[data-role="step"]');
    for (let i = 0; i < stepBlocks.length; i++) {
        const desc = stepBlocks[i].querySelector('[data-field="description"]').value.trim();
        if (!desc) {
            continue;
        }
        const file = stepBlocks[i].querySelector('[data-role="step-file-input"]').files[0];
        const url = file ? await uploadMedia(file) : "";
        steps.push({
            id: EMPTY_GUID,
            sortOrder: i + 1,
            content: desc,
            mediaUrl: url,
            mediaType: url ? "image" : ""
        });
    }
    return steps;
}