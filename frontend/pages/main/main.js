import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { SearchFilters } from '../../components/search-filters/search-filters.js';
import { RECIPE_FILTERS, createRecipeFiltersState } from '../../core/recipe-filters.js';
import { el } from "../../core/dom.js";
import { RecipeService } from '../../services/recipe-service.js';

const PAGE_SIZE = 4;
const mainState = {
    recipeFilters: createRecipeFiltersState(),
    currentPage: 1,
    totalPages: 1,

    syncWithUrl() {
        const params = new URLSearchParams(window.location.search);
        this.recipeFilters.searchValue = params.get('searchTerm') || '';

        const tags = params.getAll('tags');
        this.recipeFilters.activeFilters = new Set(tags);

        this.currentPage = parseInt(params.get('page')) || 1;
    }
};

export async function initMainPage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    mainState.syncWithUrl();
    renderMainLayout(root);
    const feedContainer = root.querySelector('.main-page__feed');
    const controlsContainer = root.querySelector('.main-page__controls');

    const loadData = async (append = false) => {
        if (!append) {
            mainState.currentPage = 1;
            feedContainer.replaceChildren(el('div', {className: 'loader', textContent: 'Загрузка...'}));
        }

        const apiParams = syncUrlAndGetApiParams();
        updatePageTitle();

        try {
            const data = await RecipeService.getAll(apiParams);
            handleMainResponse(data, feedContainer, append, loadData);
        } catch (error) {
            console.error('Ошибка при загрузке рецептов:', error);
            feedContainer.replaceChildren(el('p', {style: {color: 'red'}, textContent: 'Ошибка загрузки рецептов.'}));
        }
    };

    setupSearchFilters(controlsContainer, loadData);
    await loadData();
}

function updatePageTitle() {
    const titleEl = document.getElementById('main-title');
    if (!titleEl) return;

    const search = mainState.recipeFilters.searchValue;
    const tags = Array.from(mainState.recipeFilters.activeFilters);

    if (search) {
        titleEl.textContent = `Результаты поиска: ${search}`;
    } else if (tags.length > 0) {
        titleEl.textContent = `Рецепты категории: ${tags.join(', ')}`;
    } else {
        titleEl.textContent = 'Все рецепты';
    }
}

function syncUrlAndGetApiParams() {
    const browserParams = new URLSearchParams();

    if (mainState.recipeFilters.searchValue) {
        browserParams.set('searchTerm', mainState.recipeFilters.searchValue);
    }

    mainState.recipeFilters.activeFilters.forEach(tag => {
        browserParams.append('tags', tag);
    });

    const apiParams = {
        page: mainState.currentPage,
        pageSize: PAGE_SIZE
    };

    if (mainState.recipeFilters.searchValue) {
        apiParams.searchTerm = mainState.recipeFilters.searchValue;
    }

    const tagsArray = Array.from(mainState.recipeFilters.activeFilters);
    if (tagsArray.length > 0) {
        const apiParamsObj = new URLSearchParams();
        apiParamsObj.set('page', mainState.currentPage);
        apiParamsObj.set('pageSize', PAGE_SIZE);

        if (mainState.recipeFilters.searchValue) {
            apiParamsObj.set('searchTerm', mainState.recipeFilters.searchValue);
        }
        tagsArray.forEach(tag => apiParamsObj.append('tags', tag));

        const queryString = browserParams.toString();
        const newBrowserUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
        window.history.pushState(null, '', newBrowserUrl);

        return apiParamsObj;
    }

    const queryString = browserParams.toString();
    const newBrowserUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.pushState(null, '', newBrowserUrl);

    return apiParams;
}

function handleMainResponse(data, feedContainer, append, loadCallback) {
    mainState.totalPages = data.totalPages || data.TotalPages || 1;
    const items = data.items || data.Items || [];

    if (!append) {
        feedContainer.replaceChildren();
    }

    if (!append && items.length === 0) {
        feedContainer.replaceChildren(el('p', {className: 'main-page__empty', textContent: 'Ничего не найдено.'}));
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

function renderMainPaginationButton(container, loadCallback) {
    document.getElementById('load-more-main')?.remove();

    if (mainState.currentPage < mainState.totalPages) {
        const loadMoreBtn = el('button', {
            id: 'load-more-btn-el', // внутренний id для стилей если надо
            textContent: 'Показать ещё',
            style: {
                backgroundColor: '#6a852f',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 40px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                boxShadow: '0 4px 12px rgba(106, 133, 47, 0.2)',
                fontFamily: 'inherit'
            },
            onmouseover: (e) => e.target.style.backgroundColor = '#556b26',
            onmouseout: (e) => e.target.style.backgroundColor = '#6a852f',
            onclick: (e) => {
                e.preventDefault();
                e.target.disabled = true;
                e.target.textContent = 'Загрузка...';
                mainState.currentPage++;
                loadCallback(true);
            }
        });

        const wrapper = el('div', {
            id: 'load-more-main',
            style: { display: 'flex', justifyContent: 'center', width: '100%', padding: '40px 0', gridColumn: '1 / -1' }
        }, loadMoreBtn);

        container.appendChild(wrapper);
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
    const section = el('section', {className: 'main-page'},
        el('div', {className: 'main-page__controls'}),
        el('h1', {id: 'main-title', textContent: 'Все рецепты'}),
        el('div', {className: 'main-page__feed'})
    );
    root.replaceChildren(section);
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