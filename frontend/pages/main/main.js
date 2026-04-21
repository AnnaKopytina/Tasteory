import {RecipeCard} from '../../components/recipe-card/RecipeCard.js';
import {SearchFilters} from '../../components/search-filters/SearchFilters.js';
import {DataStore} from '../../services/data-store.js';

export function initMainPage() {
    const root = document.getElementById('content-root');

    root.innerHTML = `
        <section class="main-page">
            <div class="main-page__controls"></div>
            <h1>Все рецепты</h1>
            <div class="main-page__feed"></div>
        </section>
    `;

    const controlsContainer = root.querySelector('.main-page__controls');
    SearchFilters.renderSearchFilters(controlsContainer);

    const feedContainer = root.querySelector('.main-page__feed');
    RecipeCard.renderRecipeCards(DataStore.getMainFeedRecipes(), feedContainer, {
        onFavoriteClick: (recipe) => {
            DataStore.setRecipeFavorite(recipe.id, recipe.isFavorite);
            console.log(`Рецепт "${recipe.title}" добавлен в избранное:`, recipe.isFavorite);
        }
    });
}
