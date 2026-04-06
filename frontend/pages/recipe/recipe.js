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

window.initRecipePage = function(id) {
    const root = document.getElementById('content-root');
    const data = recipeMockData;

    root.innerHTML = `
        <div class="page-card">
            <div class="recipe-header">
                <div class="recipe-header-left">
                    <h1 class="recipe-title">${data.title}</h1>
                    <p class="recipe-meta-author">Сделано <span>${data.author}</span></p>
                </div>

                <button class="favorite-btn ${data.isFavorite ? 'active' : ''}" onclick="toggleFavorite()">
                    <img src="/svg/recipe/favourites_big.svg" alt="Favorite">
                </button>
            </div>

            <div class="recipe-image">
                <img src="${data.mainImage}" alt="${data.title}">
            </div>

            <div class="recipe-badges">
                <div class="recipe-badge">
                    <img src="/svg/recipe/favourites_small.svg" alt="">
                    <span>${data.peopleCount} человек</span>
                </div>
                <div class="recipe-dot-divider"></div>
                <div class="recipe-badge">
                    <img src="/svg/sidebar/time_circle.svg" alt="">
                    <span>${data.time} Мин</span>
                </div>
            </div>
        </div>
        <div class="page-card">
         <!-- INGREDIENTS -->
            <div class="ingredients-block">
                <div class="ingredients-header">
                    <h2>Ингредиенты <span class="ing-count">${countTotalIngredients(data)}</span></h2>
                    <div class="counter-rigth">
                        <span>Порций:</span>
                        <div class="servings-counter">
                            <button onclick="changeServings(-1)">-</button>
                            <input type="number" value="${data.currentServings}" readonly>
                            <button onclick="changeServings(1)">+</button>
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
    `;
};

// Вспомогательные функции
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
                    <img src="/svg/recipe/pointer.svg" class="arrow-icon ${isOpen ? 'active' : ''}">
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

window.watchIng = function(index) {
    const groups = document.querySelectorAll('.ing-group');
    const targetGroup = groups[index];
    if (!targetGroup) return;

    const list = targetGroup.querySelector('.ing-items');
    const arrow = targetGroup.querySelector('.arrow-icon');
    const isNowOpen = list.classList.toggle('hidden');
    arrow.classList.toggle('active');
    recipeMockData.ingredientsGroups[index].isOpen = !list.classList.contains('hidden');
};

window.changeServings = function(delta) {
    const data = recipeMockData;
    const newVal = data.currentServings + delta;
    if (newVal >= 1 && newVal <= 20) {
        data.currentServings = newVal;
        initRecipePage(data.id); // Перерисовываем
    }
};

window.toggleFavorite = function() {
    recipeMockData.isFavorite = !recipeMockData.isFavorite;
    initRecipePage(recipeMockData.id);
};

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
                ${hasMedia ? `<img src="${step.media.url}" class="step-img">` : ''}
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
                <img class="icon-close" width="16" height="16" src="/svg/sidebar/plus.svg" title="Удалить">
            </button>
            
            <!-- заметка -->
            <textarea 
                id="note-input-${index}"
                class="note-paper"
                oninput="showSave(${index})">${note}
            </textarea>

            <!-- Кнопка сохранения -->
            <button 
                id="save-btn-${index}" 
                class="btn-save hidden" 
                onclick="saveNote(${index})">Сохранить
            </button>
        </div>
    `;
}

/* ИНТЕРАКТИВА С ЗАМЕТКОЙ*/
window.addNote = function(index) {
    recipeMockData.steps[index].note = "Напишите здесь вашу заметку...";
    const area = document.getElementById(`note-area-${index}`);
    area.innerHTML = renderNoteElement(recipeMockData.steps[index].note, index);
    area.querySelector('.note-paper').focus();
};

window.deleteNote = function(index) {
    recipeMockData.steps[index].note = null;
    document.getElementById(`note-area-${index}`).innerHTML = renderNoteElement(null, index);
    console.log(`Заметка удалена из шага ${index + 1} `);
};

window.focusNote = function(index, el) {
    originalNoteValue = el.innerText;
};

window.showSave = function(index) {
    const btn = document.getElementById(`save-btn-${index}`);
    btn.classList.remove('hidden');
};

window.saveNote = function(index) {
    const textarea = document.getElementById(`note-input-${index}`);
    const btn = document.getElementById(`save-btn-${index}`);

    recipeMockData.steps[index].note = textarea.value;
    btn.classList.add('hidden');
    console.log("Заметка изменена ", textarea.value);
};