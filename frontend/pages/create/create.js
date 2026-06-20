import {RECIPE_FILTERS} from '../../core/recipe-filters.js';
import {el} from "../../core/dom.js";
import {RecipeService} from "../../services/recipe-service.js";
import {MediaService} from "../../services/media-service.js";
import {GroupService} from "../../services/group-service.js";

let selectedTags = new Set();

function getDeleteIconNode() {
    const iconStr = window.AppIcons?.render?.('delete', 'icon-btn__icon') || '🗑';
    if (iconStr === '🗑') return document.createTextNode('🗑');
    return new DOMParser().parseFromString(iconStr, 'text/html').body.firstChild;
}

async function uploadMedia(file) {
    if (!file) return null;
    try {
        const data = await MediaService.upload(file);
        return data.url || data.path;
    } catch (e) {
        throw new Error('Ошибка загрузки фото');
    }
}

function updateImageStatusUI(container, hasImage) {
    if (!container) return;
    const uploadBtn = container.querySelector('[data-action*="upload-"]');
    const deleteBtn = container.querySelector('[data-action*="clear-"]');
    const statusSpan = container.closest('.create-step__media')?.querySelector('.create-file-name');

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

function renderActiveTags(container) {
    container.replaceChildren();
    selectedTags.forEach(tagId => {
        const label = RECIPE_FILTERS.find(f => f.id === tagId)?.label || tagId;
        const chip = el('div', {class: 'tag-chip'},
            label,
            el('span', {
                class: 'tag-chip__remove',
                dataset: {action: 'remove-tag', id: tagId}
            }, '×')
        );
        container.appendChild(chip);
    });
}

function createIngredientRowNode(ing = null) {
    return el('div', {class: 'create-row create-ingredient-row', dataset: {role: 'ingredient-row'}},
        el('input', {
            class: 'create-input',
            type: 'text',
            placeholder: 'Ингредиент',
            dataset: {field: 'name'},
            value: ing?.name || ''
        }),
        el('input', {
            class: 'create-input create-input--small',
            type: 'number',
            step: '0.1',
            placeholder: 'Кол-во',
            dataset: {field: 'amount'},
            value: ing?.amount || ''
        }),
        el('input', {
            class: 'create-input create-input--small',
            type: 'text',
            placeholder: 'Мера',
            dataset: {field: 'unit'},
            value: ing?.measure || ''
        }),
        el('button', {
            class: 'icon-btn',
            type: 'button',
            dataset: {action: 'remove-ingredient'}
        }, getDeleteIconNode())
    );
}

function createSectionNode(name = "", ings = []) {
    const ingredientsContainer = el('div', {class: 'create-ingredients', dataset: {role: 'ingredients'}});

    if (ings.length > 0) {
        ings.forEach(i => ingredientsContainer.appendChild(createIngredientRowNode(i)));
    } else {
        ingredientsContainer.appendChild(createIngredientRowNode());
    }

    return el('article', {class: 'create-section', dataset: {role: 'section'}},
        el('div', {class: 'create-section__head'},
            el('input', {
                class: 'create-input',
                type: 'text',
                placeholder: 'Название секции',
                dataset: {field: 'section-name'},
                value: name
            }),
            el('button', {
                class: 'icon-btn',
                type: 'button',
                dataset: {action: 'remove-section'}
            }, getDeleteIconNode())
        ),
        ingredientsContainer,
        el('button', {
            class: 'create-btn create-btn--small',
            type: 'button',
            dataset: {action: 'add-ingredient'}
        }, '+ Ингредиент')
    );
}

function createStepNode(step = null) {
    const hasMedia = !!step?.mediaUrl;
    return el('article', {class: 'create-step', dataset: {role: 'step'}},
        el('div', {class: 'create-step__head'},
            el('textarea', {
                class: 'create-input create-textarea',
                rows: '3',
                placeholder: 'Описание шага',
                dataset: {field: 'description'},
                value: step?.content || ''
            }),
            el('button', {class: 'icon-btn', type: 'button', dataset: {action: 'remove-step'}}, getDeleteIconNode())
        ),
        el('div', {class: 'create-step__media'},
            el('div', {class: 'create-image-actions', dataset: {role: 'image-container'}},
                el('button', {
                    class: 'create-btn create-btn--small',
                    type: 'button',
                    dataset: {action: 'upload-step-photo'}
                }, hasMedia ? 'Изменить фото' : 'Загрузить фото'),
                el('button', {
                    class: `create-btn create-btn--small create-btn--grey ${hasMedia ? '' : 'is-hidden'}`,
                    type: 'button',
                    dataset: {action: 'clear-step-photo'}
                }, 'Удалить фото')
            ),
            el('span', {
                class: 'create-file-name',
                dataset: {role: 'step-file-name', currentUrl: step?.mediaUrl || ''}
            }, hasMedia ? 'Фото загружено' : 'Нет фото'),
            el('input', {
                type: 'file',
                accept: 'image/*',
                class: 'create-hidden-input',
                dataset: {role: 'step-file-input'}
            })
        )
    );
}

export async function initCreatePage(params) {
    const root = document.getElementById('content-root');
    if (!root) return;

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
        const data = await RecipeService.getById(editId);
        fillFormWithData(root, data);
    } catch (e) {
        console.error('Ошибка загрузки рецепта', e);
    }
}

function renderLayout(root, isGroupContext, editId) {
    root.replaceChildren();

    const titleText = editId ? 'Редактировать рецепт' : (isGroupContext ? 'Рецепт для группы' : 'Создать рецепт');

    const popupItems = RECIPE_FILTERS.map(f =>
        el('button', {
            type: 'button',
            dataset: {action: 'add-tag', id: f.id},
            class: 'group-page__menu-item tags-popup-item'
        }, f.label)
    );

    const tagsPopup = el('div', {id: 'tags-popup', class: 'tags-popup is-hidden'}, ...popupItems);

    const tagsSection = el('div', {class: 'create-tags-section-wrapper'},
        el('p', {class: 'create-tags-title'}, 'Категории'),
        el('div', {id: 'selected-tags-container', class: 'create-tags-container'}),
        el('div', {class: 'create-tags-dropdown-wrapper'},
            el('button', {
                type: 'button',
                class: 'create-btn create-btn--small',
                dataset: {action: 'toggle-tags-popup'}
            }, '+ Категория'),
            tagsPopup
        )
    );

    const privacySelect = el('div', {class: isGroupContext ? 'is-hidden' : ''},
        el('select', {class: 'create-input', dataset: {field: 'is-private'}},
            el('option', {value: 'false'}, 'Публичный'),
            el('option', {value: 'true'}, 'Приватный')
        )
    );

    const groupBadge = isGroupContext
        ? el('div', {class: 'create-input group-badge'}, '🔒 Групповой')
        : null;

    const block1 = el('section', {class: 'create-block'},
        el('input', {
            class: 'create-input',
            type: 'text',
            placeholder: 'Название рецепта',
            dataset: {field: 'title'}
        }),
        el('input', {
            class: 'create-input',
            type: 'number',
            placeholder: 'Время (мин)',
            dataset: {field: 'cook-time'}
        }),
        tagsSection,
        el('div', {class: 'create-row create-row--split create-row--top'},
            el('div', {class: 'create-step__media media-cover-container'},
                el('div', {class: 'create-image-actions', dataset: {role: 'image-container'}},
                    el('button', {
                        class: 'create-btn create-btn--small',
                        type: 'button',
                        dataset: {action: 'upload-cover-photo'}
                    }, 'Загрузить фото'),
                    el('button', {
                        class: 'create-btn create-btn--small create-btn--grey is-hidden',
                        type: 'button',
                        dataset: {action: 'clear-cover-photo'}
                    }, 'Удалить фото')
                ),
                el('span', {
                    class: 'create-file-name',
                    dataset: {role: 'cover-file-name', currentUrl: ''}
                }, 'Нет фото'),
                el('input', {
                    type: 'file',
                    accept: 'image/*',
                    class: 'create-hidden-input',
                    dataset: {role: 'cover-input'}
                })
            ),
            privacySelect,
            groupBadge
        )
    );

    const block2 = el('section', {class: 'create-block'},
        el('h2', {class: 'create-block__title'}, 'Ингредиенты'),
        el('div', {class: 'create-servings'},
            el('span', {}, 'Количество порций:'),
            el('div', {class: 'create-counter'},
                el('button', {type: 'button', dataset: {action: 'dec-servings'}}, '-'),
                el('input', {type: 'number', value: '1', dataset: {role: 'servings-value'}, readOnly: true}),
                el('button', {type: 'button', dataset: {action: 'inc-servings'}}, '+')
            )
        ),
        el('div', {class: 'create-sections', dataset: {role: 'sections'}}),
        el('button', {
            class: 'create-btn create-btn--center',
            type: 'button',
            dataset: {action: 'add-section'}
        }, '+ Секция')
    );

    const block3 = el('section', {class: 'create-block'},
        el('h2', {class: 'create-block__title'}, 'Шаги'),
        el('div', {class: 'create-steps', dataset: {role: 'steps'}}),
        el('button', {
            class: 'create-btn create-btn--center',
            type: 'button',
            dataset: {action: 'add-step'}
        }, '+ Шаг')
    );

    const actionsDiv = el('div', {class: 'create-actions'},
        el('button', {
            class: 'create-btn create-btn--submit',
            type: 'submit'
        }, editId ? 'Сохранить изменения' : 'Сохранить рецепт')
    );

    if (editId) {
        actionsDiv.appendChild(el('button', {
            class: 'create-btn create-btn--danger',
            type: 'button',
            dataset: {action: 'delete-recipe'}
        }, 'Удалить рецепт'));
    }

    const form = el('form', {class: 'create-form', noValidate: true},
        block1, block2, block3, actionsDiv,
        el('p', {class: 'create-status', dataset: {role: 'status'}})
    );

    const page = el('section', {class: 'create-page'},
        el('h1', {class: 'create-page__title'}, titleText),
        form
    );

    root.appendChild(page);

    if (!editId) {
        root.querySelector('[data-role="sections"]').appendChild(createSectionNode());
        root.querySelector('[data-role="steps"]').appendChild(createStepNode());
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
    secCont.replaceChildren();
    stepCont.replaceChildren();

    const sortedIngredients = [...data.ingredients].sort((a, b) => a.sortOrder - b.sortOrder);
    const sections = [];

    sortedIngredients.forEach(ing => {
        let section = sections.find(s => s.name === (ing.section || "Основные"));

        if (!section) {
            section = {name: ing.section || "Основные", items: []};
            sections.push(section);
        }

        section.items.push(ing);
    });

    sections.forEach(sec => {
        secCont.appendChild(createSectionNode(sec.name, sec.items));
    });

    const sortedSteps = [...data.steps].sort((a, b) => a.sortOrder - b.sortOrder);

    sortedSteps.forEach(s => {
        stepCont.appendChild(createStepNode(s));
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
    if (!btn) return;

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
        root.querySelector('[data-role="sections"]').appendChild(createSectionNode());
    }
    if (action === 'add-step') {
        root.querySelector('[data-role="steps"]').appendChild(createStepNode());
    }
    if (action === 'remove-section') {
        btn.closest('[data-role="section"]').remove();
    }
    if (action === 'remove-step') {
        btn.closest('[data-role="step"]').remove();
    }
    if (action === 'add-ingredient') {
        btn.closest('[data-role="section"]').querySelector('[data-role="ingredients"]').appendChild(createIngredientRowNode());
    }
    if (action === 'remove-ingredient') {
        btn.closest('[data-role="ingredient-row"]').remove();
    }

    if (action === 'delete-recipe') {
        if (confirm("Удалить рецепт навсегда?")) {
            try {
                await RecipeService.delete(editId);
                window.AppRouter.navigate('/main');
            } catch (err) {
                console.error("Ошибка удаления:", err);
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

        let created;
        if (editId) {
            created = await RecipeService.update(editId, payload);
        } else {
            created = await RecipeService.create(payload);
        }

        if (!editId && isGroupContext && created?.id) {
            await GroupService.addRecipe(groupId, created.id);
        }

        statusEl.textContent = '✅ Готово';
        setTimeout(() => window.AppRouter.navigate(isGroupContext ? `/group/${groupId}` : '/main'), 1000);

    } catch (err) {
        statusEl.textContent = '❌ Ошибка сети или сервера';
        submitBtn.disabled = false;
    }
}

function collectIngredients(form) {
    const ingredients = [];
    let order = 1;

    form.querySelectorAll('[data-role="section"]').forEach((sec) => {
        const secName = sec.querySelector('[data-field="section-name"]').value || "Основные";

        sec.querySelectorAll('[data-role="ingredient-row"]').forEach((row) => {
            const name = row.querySelector('[data-field="name"]').value.trim();
            if (!name) return;

            ingredients.push({
                name,
                amount: parseFloat(row.querySelector('[data-field="amount"]').value) || 0.1,
                measure: row.querySelector('[data-field="unit"]').value || "",
                section: secName,
                sortOrder: order++
            });
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
        steps.push({content, mediaUrl: url, sortOrder: i + 1, mediaType: url ? "image" : ""});
    }
    return steps;
}