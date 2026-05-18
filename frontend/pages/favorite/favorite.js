import { RecipeCard } from '../../components/recipe-card/recipe-card.js';

const favState = {
    currentPage: 1,
    totalPages: 1
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
    root.replaceChildren();

    const section = document.createElement('section');
    section.className = 'favorite-page';

    const header = document.createElement('div');
    header.className = 'favorite-page__header page-card';

    const title = document.createElement('h1');
    title.className = 'favorite-page__title';
    title.textContent = 'Избранное';

    const feed = document.createElement('div');
    feed.className = 'favorite-page__feed';
    feed.id = 'fav-feed';

    header.appendChild(title);
    section.appendChild(header);
    section.appendChild(feed);

    root.appendChild(section);
}

async function loadFavData(append = false) {
    const feedContainer = document.getElementById('fav-feed');
    if (!feedContainer) {
        return;
    }

    if (!append) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.textContent = 'Загрузка...';
        feedContainer.replaceChildren(loader);
    }

    try {
        const response = await fetch(`/api/users/me/favorites?page=${favState.currentPage}&pageSize=50`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }

        const data = await response.json();
        favState.totalPages = data.totalPages || 1;
        const items = data.items || [];

        processFavItems(items, feedContainer, append);
    } catch (e) {
        console.error(e);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'page-card';
        errorDiv.style.cssText = 'color:red; text-align:center;';
        errorDiv.textContent = 'Ошибка загрузки данных';
        feedContainer.replaceChildren(errorDiv);
    }
}

function processFavItems(items, feedContainer, append) {
    if (!append) {
        feedContainer.replaceChildren();
    }

    if (!append && items.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'favorite-page__empty page-card';
        emptyMsg.textContent = 'Здесь пока пусто. Сохраняйте рецепты, чтобы они появились здесь!';
        feedContainer.appendChild(emptyMsg);
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
        renderPaginationButton(feedContainer);
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

function renderPaginationButton(container) {
    const oldWrapper = document.getElementById('load-more-fav-wrapper');
    if (oldWrapper) {
        oldWrapper.remove();
    }

    if (favState.currentPage < favState.totalPages) {
        const wrapper = document.createElement('div');
        wrapper.id = 'load-more-fav-wrapper';
        wrapper.style.cssText = 'display: flex; justify-content: center; width: 100%; padding: 40px 0;';

        const btn = document.createElement('button');
        applyPaginationButtonStyle(btn);
        
        btn.textContent = 'Показать ещё';
        setupPaginationButtonEvents(btn);

        wrapper.appendChild(btn);
        container.after(wrapper);
    }
}

function applyPaginationButtonStyle(btn) {
    btn.style.cssText = `
        background-color: #6a852f;
        color: white;
        border: none;
        border-radius: 14px;
        padding: 14px 40px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
        box-shadow: 0 4px 12px rgba(106, 133, 47, 0.2);
        font-family: inherit;
    `;
}

function setupPaginationButtonEvents(btn) {
    btn.onmouseover = () => {
        btn.style.backgroundColor = '#556b26';
    };
    btn.onmouseout = () => {
        btn.style.backgroundColor = '#6a852f';
    };
    btn.onmousedown = () => {
        btn.style.transform = 'scale(0.98)';
    };
    btn.onmouseup = () => {
        btn.style.transform = 'scale(1)';
    };

    btn.onclick = (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = 'Загрузка...';
        favState.currentPage++;
        loadFavData(true);
    };
}