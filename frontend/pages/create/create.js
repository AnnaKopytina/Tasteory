const MIN_SERVINGS = 1;
const MAX_SERVINGS = 99;

function renderDeleteIcon() {
    return window.AppIcons?.renderIcon('delete', 'icon-btn__icon') || '';
}

let sectionCounter = 0;
let stepCounter = 0;

function nextSectionId() {
    sectionCounter += 1;
    return `section-${sectionCounter}`;
}

function nextStepId() {
    stepCounter += 1;
    return `step-${stepCounter}`;
}

function createIngredientRowHtml() {
    return `
        <div class="create-row create-ingredient-row" data-role="ingredient-row">
            <input class="create-input" type="text" placeholder="Ингредиент" data-field="name" />
            <input class="create-input create-input--small" type="text" placeholder="Количество" data-field="amount" />
            <input class="create-input create-input--small" type="text" placeholder="Мера" data-field="unit" />
            <button class="icon-btn" type="button" data-action="remove-ingredient" title="Удалить ингредиент" aria-label="Удалить ингредиент">
                ${renderDeleteIcon()}
            </button>
        </div>
    `;
}

function createSectionHtml() {
    const sectionId = nextSectionId();
    return `
        <article class="create-section" data-role="section" data-id="${sectionId}">
            <div class="create-row create-row--top">
                <input class="create-input" type="text" placeholder="Название секции" data-field="section-name" />
                <button class="icon-btn" type="button" data-action="remove-section" title="Удалить секцию" aria-label="Удалить секцию">
                    ${renderDeleteIcon()}
                </button>
            </div>

            <div class="create-ingredients" data-role="ingredients">
                ${createIngredientRowHtml()}
            </div>

            <button class="create-btn create-btn--small" type="button" data-action="add-ingredient">
                + Ингредиент
            </button>
        </article>
    `;
}

function createStepHtml() {
    const stepId = nextStepId();
    return `
        <article class="create-step" data-role="step" data-id="${stepId}">
            <div class="create-row create-row--top">
                <textarea class="create-input create-textarea" rows="4" placeholder="Опишите шаг приготовления" data-field="description"></textarea>
                <button class="icon-btn" type="button" data-action="remove-step" title="Удалить шаг" aria-label="Удалить шаг">
                    ${renderDeleteIcon()}
                </button>
            </div>

            <div class="create-row create-row--between">
                <button class="create-btn create-btn--small" type="button" data-action="upload-step-photo">
                    Загрузить фото шага
                </button>
                <span class="create-file-name" data-role="step-file-name">Фото не выбрано</span>
            </div>

            <input type="file" accept="image/*" class="create-hidden-input" data-role="step-file-input" />
        </article>
    `;
}

function clampServings(value) {
    return Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, value));
}

function updateServings(container, delta) {
    const input = container.querySelector('[data-role="servings-value"]');
    const current = Number(input.value) || MIN_SERVINGS;
    input.value = clampServings(current + delta);
}

function ensureAtLeastOneBlock(container, blockCreator) {
    if (!container.children.length) {
        container.insertAdjacentHTML('beforeend', blockCreator());
    }
}

function collectRecipeDraft(form) {
    const sections = Array.from(form.querySelectorAll('[data-role="section"]')).map((section) => {
        const name = section.querySelector('[data-field="section-name"]')?.value?.trim() || '';
        const ingredients = Array.from(section.querySelectorAll('[data-role="ingredient-row"]')).map((row) => ({
            name: row.querySelector('[data-field="name"]')?.value?.trim() || '',
            amount: row.querySelector('[data-field="amount"]')?.value?.trim() || '',
            unit: row.querySelector('[data-field="unit"]')?.value?.trim() || ''
        }));

        return { name, ingredients };
    });

    const steps = Array.from(form.querySelectorAll('[data-role="step"]')).map((step) => ({
        description: step.querySelector('[data-field="description"]')?.value?.trim() || '',
        photoName: step.querySelector('[data-role="step-file-input"]')?.files?.[0]?.name || null
    }));

    return {
        title: form.querySelector('[data-field="title"]')?.value?.trim() || '',
        cookTime: form.querySelector('[data-field="cook-time"]')?.value?.trim() || '',
        servings: Number(form.querySelector('[data-role="servings-value"]')?.value) || MIN_SERVINGS,
        coverName: form.querySelector('[data-role="cover-input"]')?.files?.[0]?.name || null,
        sections,
        steps
    };
}

export function initCreatePage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.innerHTML = `
        <section class="create-page">
            <h1 class="create-page__title">Создать рецепт</h1>

            <form class="create-form" novalidate>
                <section class="create-block">
                    <input class="create-input" type="text" placeholder="Название рецепта" data-field="title" />
                    <input class="create-input" type="number" min="1" placeholder="Время приготовления (мин)" data-field="cook-time" />

                    <div class="create-row create-row--split">
                        <button class="create-btn" type="button" data-action="upload-cover">Загрузить обложку</button>
                        <button class="create-btn" type="button" data-action="add-to-group">Добавить в группу</button>
                    </div>

                    <div class="create-file-row">
                        <span class="create-file-name" data-role="cover-file-name">Обложка не выбрана</span>
                    </div>

                    <input type="file" accept="image/*" class="create-hidden-input" data-role="cover-input" />
                </section>

                <section class="create-block">
                    <h2 class="create-block__title">Ингредиенты</h2>

                    <div class="create-servings">
                        <span class="create-servings__label">Сколько порций?</span>
                        <div class="create-counter" data-role="servings-control">
                            <button type="button" data-action="dec-servings">-</button>
                            <input type="number" min="1" max="99" value="1" data-role="servings-value" />
                            <button type="button" data-action="inc-servings">+</button>
                        </div>
                    </div>

                    <div class="create-sections" data-role="sections"></div>

                    <button class="create-btn create-btn--center" type="button" data-action="add-section">+ Секция</button>
                </section>

                <section class="create-block">
                    <h2 class="create-block__title">Шаги приготовления</h2>
                    <div class="create-steps" data-role="steps"></div>
                    <button class="create-btn create-btn--center" type="button" data-action="add-step">+ Шаг</button>
                </section>

                <button class="create-btn create-btn--submit" type="submit">Создать</button>
                <p class="create-status" data-role="status"></p>
            </form>
        </section>
    `;

    const form = root.querySelector('.create-form');
    const sectionsContainer = form.querySelector('[data-role="sections"]');
    const stepsContainer = form.querySelector('[data-role="steps"]');
    const coverInput = form.querySelector('[data-role="cover-input"]');
    const coverFileName = form.querySelector('[data-role="cover-file-name"]');
    const status = form.querySelector('[data-role="status"]');

    sectionsContainer.insertAdjacentHTML('beforeend', createSectionHtml());
    stepsContainer.insertAdjacentHTML('beforeend', createStepHtml());

    form.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) {
            return;
        }

        const action = actionEl.dataset.action;
        if (!action) {
            return;
        }

        switch (action) {
            case 'upload-cover': {
                coverInput.click();
                break;
            }
            case 'add-to-group': {
                status.textContent = 'Выбор группы будет доступен на следующем этапе.';
                break;
            }
            case 'dec-servings': {
                updateServings(form, -1);
                break;
            }
            case 'inc-servings': {
                updateServings(form, 1);
                break;
            }
            case 'add-section': {
                sectionsContainer.insertAdjacentHTML('beforeend', createSectionHtml());
                break;
            }
            case 'remove-section': {
                actionEl.closest('[data-role="section"]')?.remove();
                ensureAtLeastOneBlock(sectionsContainer, createSectionHtml);
                break;
            }
            case 'add-ingredient': {
                const section = actionEl.closest('[data-role="section"]');
                section?.querySelector('[data-role="ingredients"]')?.insertAdjacentHTML('beforeend', createIngredientRowHtml());
                break;
            }
            case 'remove-ingredient': {
                const row = actionEl.closest('[data-role="ingredient-row"]');
                const section = actionEl.closest('[data-role="section"]');
                row?.remove();
                const ingredientsContainer = section?.querySelector('[data-role="ingredients"]');
                ensureAtLeastOneBlock(ingredientsContainer, createIngredientRowHtml);
                break;
            }
            case 'add-step': {
                stepsContainer.insertAdjacentHTML('beforeend', createStepHtml());
                break;
            }
            case 'remove-step': {
                actionEl.closest('[data-role="step"]')?.remove();
                ensureAtLeastOneBlock(stepsContainer, createStepHtml);
                break;
            }
            case 'upload-step-photo': {
                const step = actionEl.closest('[data-role="step"]');
                const input = step?.querySelector('[data-role="step-file-input"]');
                input?.click();
                break;
            }
            default:
                break;
        }
    });

    form.addEventListener('change', (event) => {
        if (event.target === coverInput) {
            coverFileName.textContent = coverInput.files?.[0]?.name || 'Обложка не выбрана';
            return;
        }

        if (event.target.matches('[data-role="step-file-input"]')) {
            const step = event.target.closest('[data-role="step"]');
            const fileNameEl = step?.querySelector('[data-role="step-file-name"]');
            if (fileNameEl) {
                fileNameEl.textContent = event.target.files?.[0]?.name || 'Фото не выбрано';
            }
            return;
        }

        if (event.target.matches('[data-role="servings-value"]')) {
            const value = Number(event.target.value) || MIN_SERVINGS;
            event.target.value = clampServings(value);
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const draft = collectRecipeDraft(form);
        console.log('Recipe draft:', draft);
        status.textContent = 'Черновик рецепта собран. Отправку в API подключим следующим шагом.';
    });
}

