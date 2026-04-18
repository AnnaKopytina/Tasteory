const recipeMockData = {
    id: "salat-123",
    title: "Полезный салат со свежими овощами",
    author: "Васильковой Галиной",
    mainImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop",
    time: 20,
    peopleCount: 35,
    baseServings: 2,
    currentServings: 2,
    isFavorite: false,
    ingredientsGroups: [
        {
            name: "Соус",
            isOpen: true,
            items: [
                { name: "Оливковое масло", count: 3, measure: "ст. л." },
                { name: "Белый винный уксус", count: 1, measure: "ст. л." },
                { name: "Соль", count: 1, measure: "ч. л." },
                { name: "Орегано", count: 1, measure: "ч. л." },
                { name: "Черный молотый перец", count: 0.5, measure: "ч. л." }
            ]
        },
        {
            name: "Салат",
            isOpen: true,
            items: [
                { name: "Сыр фета", count: 150, measure: "г." },
                { name: "Помидоры черри", count: 200, measure: "г." },
                { name: "Огурцы", count: 200, measure: "г." },
                { name: "Салат айсберг", count: 100, measure: "г." }
            ]
        }
    ],
    steps: [
        {
            number: 1,
            text: "Несколько веточек петрушки вымойте и мелко нарежьте. В миску выложите греческий йогурт. Добавьте к нему сок половины лимона и дижонскую горчицу. Посолите и поперчите заправку, добавьте нарезанную петрушку. Смешайте ингредиенты венчиком до получения однородной консистенции соуса.",
            media: null,
            note: null
        },
        {
            number: 2,
            text: "Огурцы нарежьте полукружьями. Помидоры черри разрежьте пополам. Листья салата порвите руками на небольшие кусочки.",
            media: { type: "photo", url: "https://avatars.mds.yandex.net/i?id=2836767a3a21a42bc418181ea028ae429d22d828-9859359-images-thumbs&n=13" },
            note: null
        },
        {
            number: 3,
            text: "",
            media: { type: "photo", url: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=1000" },
            note: "Для более нежного вкуса можно использовать сыр сиртаки, но тогда солите меньше."
        }
    ]
};

function renderIcon(name, className = '') {
    return window.AppIcons?.renderIcon(name, className) || '';
}

export function initRecipePage(id) {
    const root = document.getElementById('content-root');
    const data = recipeMockData;

    // Загружаем сохраненные заметки из localStorage
    loadNotesFromStorage(data);

    root.innerHTML = `
        <div class="recipe-inner">
            <div class="page-card">
                <div class="recipe-header">
                    <div class="recipe-header-left">
                        <h1 class="recipe-title">${data.title}</h1>
                        <p class="recipe-meta-author">Сделано <span>${data.author}</span></p>
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
                                <button onclick="changeServings(-1)" aria-label="Уменьшить порции">
                                    ${renderIcon('minus', 'servings-counter__icon')}
                                </button>
                                <input type="number" value="${data.currentServings}" readonly>
                                <button onclick="changeServings(1)" aria-label="Увеличить порции">
                                    ${renderIcon('plus', 'servings-counter__icon')}
                                </button>
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
    const groups = document.querySelectorAll('.ing-group');
    const targetGroup = groups[index];
    if (!targetGroup) return;

    const list = targetGroup.querySelector('.ing-items');
    const arrow = targetGroup.querySelector('.arrow-icon');
    list.classList.toggle('hidden');
    arrow.classList.toggle('active');
    recipeMockData.ingredientsGroups[index].isOpen = !list.classList.contains('hidden');
}

function changeServings(delta) {
    const data = recipeMockData;
    const newVal = data.currentServings + delta;
    if (newVal >= 1 && newVal <= 20) {
        data.currentServings = newVal;
        initRecipePage(data.id); // Перерисовываем
    }
}

function toggleFavorite() {
    recipeMockData.isFavorite = !recipeMockData.isFavorite;
    initRecipePage(recipeMockData.id);
}

/* ШАГИ */
let originalNoteValue = "";

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
            <h3>Шаг ${step.number}</h3>
            <div class="${layoutClass}">
                ${hasMedia ? `<img src="${step.media.url}" alt="Иллюстрация шага ${step.number}" class="step-img">` : ''}
                ${hasText ? `<p class="step-text">${step.text}</p>` : ''}
            </div>
            <div class="note-area" id="note-area-${i}">
                ${renderNoteElement(step.note, i)}
            </div>
        </div>
        `;
    }).join('');
}

function renderNoteElement(note, index) {
    if (note === null) {
        return `
            <button class="add-note-btn" onclick="addNote(${index})">
                Добавить заметку
            </button>
        `;
    }
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
    recipeMockData.steps[index].note = "";
    saveNoteToStorage(recipeMockData.id, index, "");
    const area = document.getElementById(`note-area-${index}`);
    area.innerHTML = renderNoteElement(recipeMockData.steps[index].note, index);
    const textarea = area.querySelector('.note-paper');
    autoResizeNote(textarea);
    textarea.focus();
}

function deleteNote(index) {
    recipeMockData.steps[index].note = null;
    saveNoteToStorage(recipeMockData.id, index, null);
    document.getElementById(`note-area-${index}`).innerHTML = renderNoteElement(null, index);
    console.log(`Заметка удалена из шага ${index + 1} `);
}

function focusNote(index, el) {
    originalNoteValue = el.innerText;
}

function handleNoteInput(index, textarea) {
    autoResizeNote(textarea);
    recipeMockData.steps[index].note = textarea.value;
    saveNoteToStorage(recipeMockData.id, index, textarea.value);
    console.log("Заметка сохранена: ", textarea.value);
}

Object.assign(window, {
    watchIng,
    changeServings,
    toggleFavorite,
    addNote,
    deleteNote,
    focusNote,
    handleNoteInput
});
