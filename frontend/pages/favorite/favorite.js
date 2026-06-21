import {RecipeCard} from '../../components/recipe-card/recipe-card.js';
import {RecipeService} from '../../services/recipe-service.js';
import {createLoadMoreBtn} from '../../components/load-more-btn/load-more-btn.js';
import {el} from "../../core/dom.js";

const favState = {
    currentPage: 1, totalPages: 1
};

export async function initFavoritePage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    favState.currentPage = 1;

    renderFavoriteStructure(root);
    await loadFavData(false);
}

function renderFavoriteStructure(root) {
    root.replaceChildren(el('section', {class: 'favorite-page'}, el('div', {class: 'favorite-page__header page-card'}, el('h1', {class: 'favorite-page__title'}, 'Избранное')), el('div', {
        class: 'favorite-page__feed',
        id: 'fav-feed'
    })));
}

async function loadFavData(append = false) {
    const feedContainer = document.getElementById('fav-feed');
    if (!feedContainer) {
        return;
    }

    if (!append) {
        feedContainer.replaceChildren(el('div', {class: 'loader'}, 'Загрузка...'));
    }

    try {
        const data = await RecipeService.getFavorites(favState.currentPage, 50);

        favState.totalPages = data.totalPages || 1;
        const items = data.items || [];

        processFavItems(items, feedContainer, append);
    } catch (e) {
        console.error('Ошибка загрузки избранного:', e);
        feedContainer.replaceChildren(el('div', {class: 'page-card favorite-error'}, 'Ошибка загрузки данных'));
    }
}

function processFavItems(items, feedContainer, append) {
    if (!append) {
        feedContainer.replaceChildren();
    }

    if (!append && items.length === 0) {
        feedContainer.appendChild(el('div', {class: 'favorite-page__empty page-card'}, 'Здесь пока пусто. Сохраняйте рецепты, чтобы они появились здесь!'));
    } else {
        const mapped = items.map(r => ({
            ...r,
            image: r.mainImage || '',
            time: r.timeMinutes || 0,
            author: r.authorName || 'Автор',
            isFavorite: true,
            favoritesCount: r.favoritesCount || 0
        }));

        renderRecipesToFeed(mapped, feedContainer);

        const oldWrapper = document.getElementById('load-more-wrapper');
        if (oldWrapper) oldWrapper.remove();

        const loadMoreNode = createLoadMoreBtn({
            currentPage: favState.currentPage, totalPages: favState.totalPages, onLoad: async () => {
                favState.currentPage++;
                await loadFavData(true);
            }
        });

        if (loadMoreNode) {
            feedContainer.after(loadMoreNode);
        }
    }
}

function renderRecipesToFeed(mappedItems, container) {
    const temp = document.createElement('div');
    RecipeCard.renderRecipeCards(mappedItems, temp, {
        onFavoriteClick: (recipe) => {
            if (!recipe.isFavorite) {
                initFavoritePage();
            }
        }
    });

    while (temp.firstChild) {
        container.appendChild(temp.firstChild);
    }
}