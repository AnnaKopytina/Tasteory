import { RecipeCard } from '../../components/recipe-card/recipe-card.js';

export async function initFavoritePage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    renderSkeleton(root);

    const feedContainer = root.querySelector('.favorite-page__feed');

    try {
        const response = await fetchFavoritesData();
        await handleFavoritesResponse(response, feedContainer, root);
    } catch (error) {
        handleError(feedContainer, error);
    }
}

function renderSkeleton(root) {
    root.innerHTML = `
        <section class="favorite-page">
            <div class="favorite-page__header page-card">
                <h1 class="favorite-page__title">Избранное</h1>
            </div>
            <div class="favorite-page__feed">
                <div class="loader">Загрузка ваших закладок...</div>
            </div>
        </section>
    `;
}

async function fetchFavoritesData() {
    return await fetch('/api/users/me/favorites?page=1&pageSize=50', {
        method: 'GET',
        credentials: 'include'
    });
}

async function handleFavoritesResponse(response, feedContainer, root) {
    if (!response.ok) {
        if (response.status === 401) {
            window.AppRouter.navigate('/auth');
            return;
        }
        throw new Error('Ошибка при загрузке избранного');
    }

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) {
        renderEmptyState(feedContainer);
        return;
    }

    const mappedRecipes = mapRecipes(items);
    renderFeed(feedContainer, mappedRecipes, root);
}

function renderEmptyState(container) {
    container.innerHTML = `
        <div class="favorite-page__empty page-card">
            Здесь будут рецепты, которые вы сохраните
        </div>`;
}

function mapRecipes(items) {
    return items.map((r) => {
        return {
            ...r,
            image: r.mainImage,
            time: r.timeMinutes,
            author: r.authorName,
            isFavorite: true
        };
    });
}

function handleError(container, error) {
    console.error(error);
    container.innerHTML = '<div class="favorite-page__empty page-card">Не удалось загрузить данные</div>';
}

function renderFeed(container, recipes, root) {
    container.innerHTML = '';

    RecipeCard.renderRecipeCards(recipes, container, {
        onFavoriteClick: (recipe) => {
            if (!recipe.isFavorite) {
                initFavoritePage();
            }
        }
    });
}