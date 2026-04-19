import { RecipeCard } from '../../components/recipe-card/RecipeCard.js';

const favoriteRecipes = [
    {
        id: 'fav-1',
        title: 'Полезный салат со свежими овощами',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=500&auto=format&fit=crop',
        author: 'Василькова Галина',
        time: 20,
        servings: 35,
        isFavorite: true
    },
    {
        id: 'fav-2',
        title: 'Паста с томатным соусом',
        image: 'https://img.povar.ru/main-micro/00/00/6c/83/spagetti_chetire_pomidora-825929.jpg',
        author: 'Петров Иван',
        time: 25,
        servings: 12,
        isFavorite: true
    }
];

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
    const items = favoriteRecipes.filter((recipe) => recipe.isFavorite);

    if (!items.length) {
        feedContainer.innerHTML = '<div class="favorite-page__empty page-card">Пока нет избранных рецептов</div>';
        return;
    }

    RecipeCard.renderRecipeCards(items, feedContainer, {
        onFavoriteClick: () => {
            const updatedItems = favoriteRecipes.filter((recipe) => recipe.isFavorite);
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
