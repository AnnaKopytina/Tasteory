import { RecipeCard } from '../../components/recipe-card/RecipeCard.js';
import {DataStore} from '../../services/data-store.js';

export function initFavoritePage() {
    const root = document.getElementById('content-root');

    root.innerHTML = `
        <section class="favorite-page">
            <div class="favorite-page__header page-card">
                <h1 class="favorite-page__title">Избранное</h1>
            </div>

            <div class="favorite-page__feed"></div>
        </section>
    `;

    const feedContainer = root.querySelector('.favorite-page__feed');
    const items = DataStore.getFavoriteRecipes();

    if (!items.length) {
        feedContainer.innerHTML = '<div class="favorite-page__empty page-card">Пока нет избранных рецептов</div>';
        return;
    }

    RecipeCard.renderRecipeCards(items, feedContainer, {
        onFavoriteClick: (recipe) => {
            DataStore.setRecipeFavorite(recipe.id, recipe.isFavorite);
            const updatedItems = DataStore.getFavoriteRecipes();
            if (!updatedItems.length) {
                feedContainer.innerHTML = '<div class="favorite-page__empty page-card">Пока нет избранных рецептов</div>';
                return;
            }

            RecipeCard.renderRecipeCards(updatedItems, feedContainer, {
                onFavoriteClick: () => initFavoritePage()
            });
        }
    });
}
