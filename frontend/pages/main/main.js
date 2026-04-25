import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { SearchFilters } from '../../components/search-filters/search-filters.js';
import { RECIPE_FILTERS, createRecipeFiltersState } from '../../core/recipe-filters.js';

const mainState = {
    recipeFilters: createRecipeFiltersState(),
    currentPage: 1,
    totalPages: 1
};

export async function initMainPage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    mainState.currentPage = 1;
    renderMainLayout(root);

    const feedContainer = root.querySelector('.main-page__feed');
    const controlsContainer = root.querySelector('.main-page__controls');

    const loadData = async (append = false) => {
        if (!append) {
            mainState.currentPage = 1;
            feedContainer.innerHTML = '<div class="loader">Загрузка...</div>';
        }
        
        const url = constructMainUrl();

        try {
            const response = await fetch(url, { method: 'GET', credentials: 'include' });
            const data = await response.json();
            handleMainResponse(data, feedContainer, append, loadData);
        } catch (error) {
            feedContainer.innerHTML = '<p style="color:red">Ошибка загрузки рецептов.</p>';
        }
    };

    setupSearchFilters(controlsContainer, loadData);

    await loadData();
}

function constructMainUrl() {
    let url = `/api/recipes?page=${mainState.currentPage}&pageSize=50`;
    const activeTags = Array.from(mainState.recipeFilters.activeFilters);
    
    if (activeTags.length) {
        url += '&' + activeTags.map(t => `tags=${encodeURIComponent(t)}`).join('&');
    }
    
    if (mainState.recipeFilters.searchValue) {
        url += `&searchTerm=${encodeURIComponent(mainState.recipeFilters.searchValue)}`;
    }
    
    return url;
}

function handleMainResponse(data, feedContainer, append, loadCallback) {
    mainState.totalPages = data.totalPages || data.TotalPages || 1;
    const items = data.items || data.Items || [];

    if (!append) {
        feedContainer.innerHTML = '';
    }

    if (!append && items.length === 0) {
        feedContainer.innerHTML = '<p class="main-page__empty">Ничего не найдено.</p>';
        const oldBtn = document.getElementById('load-more-main');
        if (oldBtn) {
            oldBtn.remove();
        }
    } else {
        const mapped = mapIncomingRecipes(items);
        const temp = document.createElement('div');
        RecipeCard.renderRecipeCards(mapped, temp);
        
        while (temp.firstChild) {
            feedContainer.appendChild(temp.firstChild);
        }

        renderMainPaginationButton(feedContainer, loadCallback);
    }
}

function renderMainPaginationButton(feedContainer, loadCallback) {
    let wrapper = document.getElementById('load-more-main');
    if (wrapper) {
        wrapper.remove();
    }

    if (mainState.currentPage < mainState.totalPages) {
        wrapper = document.createElement('div');
        wrapper.id = 'load-more-main';
        wrapper.style.cssText = 'display: flex; justify-content: center; width: 100%; padding: 40px 0; grid-column: 1 / -1;';

        const btn = document.createElement('button');
        btn.style.cssText = `
            background-color: #6a852f;
            color: white;
            border: none;
            border-radius: 14px;
            padding: 14px 40px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, background-color 0.2s;
            box-shadow: 0 4px 12px rgba(106, 133, 47, 0.2);
            font-family: inherit;
        `;
        
        btn.textContent = 'Показать ещё';
        
        btn.onmouseover = () => {
            btn.style.backgroundColor = '#556b26';
        };
        btn.onmouseout = () => {
            btn.style.backgroundColor = '#6a852f';
        };

        btn.onclick = (e) => {
            e.preventDefault();
            btn.disabled = true;
            btn.textContent = 'Загрузка...';
            mainState.currentPage++;
            loadCallback(true);
        };

        wrapper.appendChild(btn);
        feedContainer.after(wrapper);
    }
}

function setupSearchFilters(container, loadCallback) {
    SearchFilters.renderSearchFilters(container, {
        filters: RECIPE_FILTERS,
        searchValue: mainState.recipeFilters.searchValue,
        activeFilters: Array.from(mainState.recipeFilters.activeFilters),
        onSearch: (value) => { 
            mainState.recipeFilters.searchValue = value; 
            loadCallback(); 
        },
        onFilterToggle: (_, __, activeFilters) => { 
            mainState.recipeFilters.activeFilters = new Set(activeFilters); 
            loadCallback(); 
        }
    });
}

function renderMainLayout(root) {
    root.innerHTML = `<section class="main-page"><div class="main-page__controls"></div><h1>Все рецепты</h1><div class="main-page__feed"></div></section>`;
}

function mapIncomingRecipes(items) {
    return items.map(r => ({
        ...r,
        image: r.mainImage || '',
        time: r.timeMinutes || 0,
        author: r.authorName || 'Автор',
        isFavorite: !!r.isFavorite,
        favoritesCount: r.favoritesCount || 0
    }));
}