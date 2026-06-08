import { RECIPE_FILTERS } from '../../core/recipe-filters.js';
import { el } from "../../core/dom.js";
import { RecipeService } from "../../services/recipe-service.js";
import { MediaService } from "../../services/media-service.js";
import { GroupService } from "../../services/group-service.js";

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
        const chip = el('div', {
                className: 'tag-chip',
                style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#e9eef2',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    gap: '8px',
                    color: '#102e3f'
                }
            },
            label,
            el('span', {
                dataset: {action: 'remove-tag', id: tagId},
                style: {cursor: 'pointer', fontWeight: 'bold', color: '#f28c50'},
                textContent: '×'
            })
        );
        container.appendChild(chip);
    });
}

function createIngredientRowNode(ing = null) {
    return el('div', {className: 'create-row create-ingredient-row', dataset: {role: 'ingredient-row'}},
        el('input', {
            className: 'create-input',
            type: 'text',
            placeholder: 'Ингредиент',
            dataset: {field: 'name'},
            value: ing?.name || ''
        }),
        el('input', {
            className: 'create-input create-input--small',
            type: 'number',
            step: '0.1',
            placeholder: 'Кол-во',
            dataset: {field: 'amount'},
            value: ing?.amount || ''
        }),
        el('input', {
            className: 'create-input create-input--small',
            type: 'text',
            placeholder: 'Мера',
            dataset: {field: 'unit'},
            value: ing?.measure || ''
        }),
        el('button', {
            className: 'icon-btn',
            type: 'button',
            dataset: {action: 'remove-ingredient'}
        }, getDeleteIconNode())
    );
}

function createSectionNode(name = "", ings = []) {
    const ingredientsContainer = el('div', {className: 'create-ingredients', dataset: {role: 'ingredients'}});
    if (ings.length > 0) {
        ings.forEach(i => ingredientsContainer.appendChild(createIngredientRowNode(i)));
    } else {
        ingredientsContainer.appendChild(createIngredientRowNode());
    }

    return el('article', {className: 'create-section', dataset: {role: 'section'}},
        el('div', {className: 'create-section__head'},
            el('input', {
                className: 'create-input',
                type: 'text',
                placeholder: 'Название секции',
                dataset: {field: 'section-name'},
                value: name
            }),
            el('button', {
                className: 'icon-btn',
                type: 'button',
                dataset: {action: 'remove-section'}
            }, getDeleteIconNode())
        ),
        ingredientsContainer,
        el('button', {
            className: 'create-btn create-btn--small',
            type: 'button',
            dataset: {action: 'add-ingredient'},
            textContent: '+ Ингредиент'
        })
    );
}

function createStepNode(step = null) {
    const hasMedia = !!step?.mediaUrl;
    return el('article', {className: 'create-step', dataset: {role: 'step'}},
        el('div', {className: 'create-step__head'},
            el('textarea', {
                className: 'create-input create-textarea',
                rows: '3',
                placeholder: 'Описание шага',
                dataset: {field: 'description'},
                value: step?.content || ''
            }),
            el('button', {className: 'icon-btn', type: 'button', dataset: {action: 'remove-step'}}, getDeleteIconNode())
        ),
        el('div', {className: 'create-step__media'},
            el('div', {className: 'create-image-actions', dataset: {role: 'image-container'}},
                el('button', {
                    className: 'create-btn create-btn--small',
                    type: 'button',
                    dataset: {action: 'upload-step-photo'},
                    textContent: hasMedia ? 'Изменить фото' : 'Загрузить фото'
                }),
                el('button', {
                    className: `create-btn create-btn--small ${hasMedia ? '' : 'is-hidden'}`,
                    type: 'button',
                    dataset: {action: 'clear-step-photo'},
                    style: {background: '#7c8a98'},
                    textContent: 'Удалить фото'
                })
            ),
            el('span', {
                className: 'create-file-name',
                dataset: {role: 'step-file-name', currentUrl: step?.mediaUrl || ''},
                textContent: hasMedia ? 'Фото загружено' : 'Нет фото'
            }),
            el('input', {
                type: 'file',
                accept: 'image/*',
                className: 'create-hidden-input',
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
            className: 'group-page__menu-item',
            style: {padding: '8px', fontSize: '14px', borderRadius: '6px'},
            textContent: f.label
        })
    );

    const tagsPopup = el('div', {
        id: 'tags-popup',
        className: 'is-hidden',
        style: {
            position: 'absolute',
            top: '100%',
            left: '0',
            background: 'white',
            border: '1px solid #d8dde4',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: '10',
            padding: '10px',
            width: '200px',
            display: 'grid',
            gap: '4px',
            marginTop: '5px'
        }
    }, ...popupItems);

    const tagsSection = el('div', {className: 'create-tags-section', style: {margin: '10px 0 20px 0'}},
        el('p', {
            style: {fontSize: '14px', fontWeight: '600', color: '#4a5f70', marginBottom: '8px'},
            textContent: 'Категории'
        }),
        el('div', {
            id: 'selected-tags-container',
            style: {display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px'}
        }),
        el('div', {style: {position: 'relative', display: 'inline-block'}},
            el('button', {
                type: 'button',
                className: 'create-btn create-btn--small',
                dataset: {action: 'toggle-tags-popup'},
                textContent: '+ Категория'
            }),
            tagsPopup
        )
    );
    const privacySelect = el('div', {style: {display: isGroupContext ? 'none' : 'block'}},
        el('select', {className: 'create-input', dataset: {field: 'is-private'}},
            el('option', {value: 'false', textContent: 'Публичный'}),
            el('option', {value: 'true', textContent: 'Приватный'})
        )
    );

    const groupBadge = isGroupContext ? el('div', {
        className: 'create-input',
        style: {background: '#f5f5f5', display: 'flex', alignItems: 'center', color: '#666', height: '45px'},
        textContent: '🔒 Групповой'
    }) : null;
    const block1 = el('section', {className: 'create-block'},
        el('input', {
            className: 'create-input',
            type: 'text',
            placeholder: 'Название рецепта',
            dataset: {field: 'title'}
        }),
        el('input', {
            className: 'create-input',
            type: 'number',
            placeholder: 'Время (мин)',
            dataset: {field: 'cook-time'}
        }),
        tagsSection,
        el('div', {className: 'create-row create-row--split', style: {alignItems: 'flex-start'}},
            el('div', {
                    className: 'create-step__media',
                    style: {flexGrow: '1', background: 'none', padding: '0', border: 'none'}
                },
                el('div', {className: 'create-image-actions', dataset: {role: 'image-container'}},
                    el('button', {
                        className: 'create-btn create-btn--small',
                        type: 'button',
                        dataset: {action: 'upload-cover-photo'},
                        textContent: 'Загрузить фото'
                    }),
                    el('button', {
                        className: 'create-btn create-btn--small is-hidden',
                        type: 'button',
                        dataset: {action: 'clear-cover-photo'},
                        style: {background: '#7c8a98'},
                        textContent: 'Удалить фото'
                    })
                ),
                el('span', {
                    className: 'create-file-name',
                    dataset: {role: 'cover-file-name', currentUrl: ''},
                    textContent: 'Нет фото'
                }),
                el('input', {
                    type: 'file',
                    accept: 'image/*',
                    className: 'create-hidden-input',
                    dataset: {role: 'cover-input'}
                })
            ),
            privacySelect,
            groupBadge
        )
    );

    const block2 = el('section', {className: 'create-block'},
        el('h2', {className: 'create-block__title', textContent: 'Ингредиенты'}),
        el('div', {className: 'create-servings'},
            el('span', {textContent: 'Количество порций:'}),
            el('div', {className: 'create-counter'},
                el('button', {type: 'button', dataset: {action: 'dec-servings'}, textContent: '-'}),
                el('input', {type: 'number', value: '1', dataset: {role: 'servings-value'}, readOnly: true}),
                el('button', {type: 'button', dataset: {action: 'inc-servings'}, textContent: '+'})
            )
        ),
        el('div', {className: 'create-sections', dataset: {role: 'sections'}}),
        el('button', {
            className: 'create-btn create-btn--center',
            type: 'button',
            dataset: {action: 'add-section'},
            textContent: '+ Секция'
        })
    );

    const block3 = el('section', {className: 'create-block'},
        el('h2', {className: 'create-block__title', textContent: 'Шаги'}),
        el('div', {className: 'create-steps', dataset: {role: 'steps'}}),
        el('button', {
            className: 'create-btn create-btn--center',
            type: 'button',
            dataset: {action: 'add-step'},
            textContent: '+ Шаг'
        })
    );

    const actionsDiv = el('div', {
            className: 'create-actions',
            style: {display: 'flex', flexDirection: 'column', gap: '10px'}
        },
        el('button', {
            className: 'create-btn create-btn--submit',
            type: 'submit',
            textContent: editId ? 'Сохранить изменения' : 'Сохранить рецепт'
        })
    );

    if (editId) {
        actionsDiv.appendChild(el('button', {
            className: 'create-btn',
            type: 'button',
            dataset: {action: 'delete-recipe'},
            style: {background: '#f28c50'},
            textContent: 'Удалить рецепт'
        }));
    }

    const form = el('form', {className: 'create-form', noValidate: true},
        block1, block2, block3, actionsDiv,
        el('p', {
            className: 'create-status',
            dataset: {role: 'status'},
            style: {textAlign: 'center', fontWeight: 'bold', marginTop: '15px'}
        })
    );

    const page = el('section', {className: 'create-page'},
        el('h1', {className: 'create-page__title', textContent: titleText}),
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