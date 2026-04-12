import { RecipeCard } from '../../components/recipe-card/RecipeCard.js';
import { SearchFilters } from '../../components/search-filters/SearchFilters.js';

const mockRecipes = [
    {
        id: '1',
        title: 'Полезный салат со свежими овощами',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=500&auto=format&fit=crop',
        author: 'Васильковой Галиной',
        time: 20,
        servings: 2,
        isFavorite: false
    },
    {
        id: '2',
        title: 'Паста с томатным соусом',
        image: 'https://images.unsplash.com/photo-1473093295203-cec9a50e9053?q=80&w=500&auto=format&fit=crop',
        author: 'Петров Иван',
        time: 25,
        servings: 4,
        isFavorite: false
    },
    {
        id: '3',
        title: 'Шоколадное печенье',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=500&auto=format&fit=crop',
        author: 'Сидоровой Марией',
        time: 30,
        servings: 12,
        isFavorite: false
    }
];

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
    RecipeCard.renderRecipeCards(mockRecipes, feedContainer, {
        onFavoriteClick: (recipe) => {
            console.log(`Рецепт "${recipe.title}" добавлен в избранное:`, recipe.isFavorite);
        }
    });
}
