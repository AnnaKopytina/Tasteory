const recipeData = {
    title: "Торт Цветок",
    imageSrc: "https://static.1000.menu/img/content-v2/00/7f/66280/tort-cvetok_1657479380_33_max.jpg",
    author: "Юлия",
    likes: 0,
    views: 48310,
    isLiked: false,

    description: "Оригинальный, красивый, нежнейший, праздничный! Торт Цветок можно сделать из любых коржей: песочных, медовых или, как в этом рецепте, бисквитных. Этот яркий, очень вкусный десерт с интересным оформлением украсит любой праздник. Особенно хорош для детского чаепития!",
    currentServings: 7,
    baseServings: 7,

    icons: {
        heartEmpty: 'svg/like-heard-not-filled.svg',
        heartFilled: 'svg/like-heart-filled.svg',
        eye: 'svg/eye-svgrepo-com.svg'
    },
    ingredients: [
        { name: "Яйца", count: 4, measure: "pcs" },
        { name: "Сахар", count: 120, measure: "g" },
        { name: "Разрыхлитель", count: 0.3, measure: "tsp" },
        { name: "Пшеничная мука", count: 110, measure: "g" },
        { name: "Кукурузный крахмал", count: 25, measure: "g" }
    ]
};

const measureTranslation = {
    "g": "гр",
    "kg": "кг",
    "ml": "мл",
    "l": "л",
    "pcs": "шт.",
    "tsp": "ч.л.",
    "tbsp": "ст.л.",
    "cup": "ст.(250мл.)"
};

function formatNumber(num) {
    return parseFloat(num.toFixed(2));
}

function renderRecipe() {
    document.querySelector('.recipe-title').textContent = recipeData.title;
    document.getElementById('recipe-img').src = recipeData.imageSrc;
    document.getElementById('author-name').textContent = recipeData.author;
    document.getElementById('view-count').textContent = recipeData.views.toLocaleString();
    document.getElementById('view-icon').src = recipeData.icons.eye;
    document.querySelector('.recipe-description p').textContent = recipeData.description;


    document.getElementById('like-count').textContent = recipeData.likes;
    const likeIcon = document.getElementById('like-icon');
    likeIcon.src = recipeData.isLiked ? recipeData.icons.heartFilled : recipeData.icons.heartEmpty;

    document.getElementById('yield_num_input').value = recipeData.currentServings;

    const listContainer = document.querySelector('.ingredients-list');
    listContainer.innerHTML = '';

    recipeData.ingredients.forEach(ing => {
        const calculatedCount = (ing.count / recipeData.baseServings) * recipeData.currentServings;
        const translatedMeasure = measureTranslation[ing.measure] || ing.measure;

        const li = document.createElement('li');
        li.innerHTML = `
        <span class="ing-name">${ing.name}</span>
        <span class="ing-dots"></span>
        <span class="ing-value">${formatNumber(calculatedCount)} ${translatedMeasure}</span>
        `;
        listContainer.appendChild(li);
    });
}

function setupEventListeners() {
    document.getElementById('like-button').addEventListener('click', () => {
        recipeData.isLiked = !recipeData.isLiked;
        recipeData.likes += recipeData.isLiked ? 1 : -1;
        console.log(recipeData.isLiked ? 'заполнено' : 'незаполнено');
        renderRecipe();
    });

    const input = document.getElementById('yield_num_input');
    const plusBtn = document.querySelector('.spin-buttons .plus');
    const minusBtn = document.querySelector('.spin-buttons .minus');

    const updateServings = (newVal) => {
        const val = parseInt(newVal);
        if (val > 0 && val < 100) {
            recipeData.currentServings = val;
            renderRecipe();
        }
    };

    plusBtn.addEventListener('click', () => updateServings(recipeData.currentServings + 1));
    minusBtn.addEventListener('click', () => updateServings(recipeData.currentServings - 1));
    input.addEventListener('input', (e) => updateServings(e.target.value));
}

renderRecipe();
setupEventListeners();