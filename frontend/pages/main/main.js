import {RecipeCard} from '../../components/recipe-card/recipe-card.js';
import {SearchFilters} from '../../components/search-filters/search-filters.js';
import {DataStore} from '../../services/data-store.js';
import { RECIPE_FILTERS, createRecipeFiltersState, filterRecipes } from '../../core/recipe-filters.js';

const mainState = {
    recipeFilters: createRecipeFiltersState()
};

export function initMainPage() {
    const root = document.getElementById('content-root');
    mainState.recipeFilters = createRecipeFiltersState();

    root.innerHTML = `
        <section class="main-page">
            <div class="main-page__controls"></div>
            <h1>Все рецепты</h1>
            <div class="main-page__feed"></div>
        </section>
    `;

    const controlsContainer = root.querySelector('.main-page__controls');
    const feedContainer = root.querySelector('.main-page__feed');

    const rerenderFeed = () => {
        const recipes = filterRecipes(DataStore.getMainFeedRecipes(), mainState.recipeFilters);

        if (!recipes.length) {
            feedContainer.innerHTML = '<p class="main-page__empty">Ничего не найдено. Попробуйте изменить поиск или фильтр.</p>';
            return;
        }

        RecipeCard.renderRecipeCards(recipes, feedContainer, {
            onFavoriteClick: (recipe) => {
                DataStore.setRecipeFavorite(recipe.id, recipe.isFavorite);
                console.log(`Рецепт "${recipe.title}" добавлен в избранное:`, recipe.isFavorite);
            }
        });
    };

    SearchFilters.renderSearchFilters(controlsContainer, {
        filters: RECIPE_FILTERS,
        searchValue: mainState.recipeFilters.searchValue,
        activeFilters: Array.from(mainState.recipeFilters.activeFilters),
        onSearch: (value) => {
            mainState.recipeFilters.searchValue = value;
            rerenderFeed();
        },
        onFilterToggle: (_, __, activeFilters) => {
            mainState.recipeFilters.activeFilters = new Set(activeFilters);
            rerenderFeed();
        }
    });

    rerenderFeed();
}
