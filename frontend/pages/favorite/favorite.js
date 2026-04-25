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
    root.innerHTML = `
        <section class="favorite-page">
            <div class="favorite-page__header page-card">
                <h1 class="favorite-page__title">Избранное</h1>
            </div>
            <div class="favorite-page__feed" id="fav-feed"></div>
        </section>
    `;
}

async function loadFavData(append = false) {
    const feedContainer = document.getElementById('fav-feed');
    if (!feedContainer) {
        return;
    }

    if (!append) {
        feedContainer.innerHTML = '<div class="loader">Загрузка...</div>';
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
        feedContainer.innerHTML = '<div class="page-card" style="color:red; text-align:center;">Ошибка загрузки данных</div>';
    }
}

function processFavItems(items, feedContainer, append) {
    if (!append) {
        feedContainer.innerHTML = '';
    }

    if (!append && items.length === 0) {
        feedContainer.innerHTML = '<div class="favorite-page__empty page-card">Здесь пока пусто. Сохраняйте рецепты, чтобы они появились здесь!</div>';
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