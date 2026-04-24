import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { SearchFilters } from '../../components/search-filters/search-filters.js';
import { RECIPE_FILTERS, createRecipeFiltersState, filterRecipes } from '../../core/recipe-filters.js';

const mainState = {
    recipeFilters: createRecipeFiltersState(),
    allRecipes: []
};

export async function initMainPage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    mainState.recipeFilters = createRecipeFiltersState();

    renderMainLayout(root);

    const controlsContainer = root.querySelector('.main-page__controls');
    const feedContainer = root.querySelector('.main-page__feed');

    const rerenderFeed = () => {
        renderFilteredContent(feedContainer, mainState.allRecipes, mainState.recipeFilters);
    };

    initFilters(controlsContainer, rerenderFeed);

    await loadMainData(feedContainer, rerenderFeed);
}

function renderMainLayout(root) {
    root.innerHTML = `
        <section class="main-page">
            <div class="main-page__controls"></div>
            <h1>Все рецепты</h1>
            <div class="main-page__feed">
                <div class="loader">Загрузка...</div>
            </div>
        </section>
    `;
}

function renderFilteredContent(container, allRecipes, filters) {
    const filtered = filterRecipes(allRecipes, filters);

    if (!filtered.length) {
        container.innerHTML = '<p class="main-page__empty">Ничего не найдено. Попробуйте изменить поиск или фильтр.</p>';
        return;
    }

    container.innerHTML = '';
    RecipeCard.renderRecipeCards(filtered, container, {
        onFavoriteClick: (recipe) => {
            console.log(`Рецепт "${recipe.title}" в избранное`);
        }
    });
}

function initFilters(container, onUpdate) {
    SearchFilters.renderSearchFilters(container, {
        filters: RECIPE_FILTERS,
        searchValue: mainState.recipeFilters.searchValue,
        activeFilters: Array.from(mainState.recipeFilters.activeFilters),
        onSearch: (value) => {
            mainState.recipeFilters.searchValue = value;
            onUpdate();
        },
        onFilterToggle: (_, __, activeFilters) => {
            mainState.recipeFilters.activeFilters = new Set(activeFilters);
            onUpdate();
        }
    });
}

async function loadMainData(feedContainer, onSuccess) {
    try {
        const response = await fetch('/api/recipes?page=1&pageSize=50', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }

        const data = await response.json();
        const items = data.items || data.Items || [];

        mainState.allRecipes = mapIncomingRecipes(items);
        onSuccess();
    } catch (error) {
        handleLoadError(feedContainer, error);
    }
}

function mapIncomingRecipes(items) {
    return items.map((r) => {
        return {
            ...r,
            image: r.mainImage,
            time: r.timeMinutes,
            author: r.authorName,
            isFavorite: r.isFavorite,
            favoritesCount: r.favoritesCount,
            type: (r.tags && r.tags.length > 0) ? r.tags[0].toLowerCase() : ''
        };
    });
}

function handleLoadError(container, error) {
    console.error('Ошибка загрузки:', error);
    container.innerHTML = '<p style="color:red">Не удалось загрузить рецепты.</p>';
}