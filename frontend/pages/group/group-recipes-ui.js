import { SearchFilters } from '../../components/search-filters/search-filters.js';
import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { filterRecipes as filterGroupRecipes, RECIPE_FILTERS as GROUP_RECIPE_FILTERS } from '../../core/recipe-filters.js';

function renderEmptyState(container) {
    container.innerHTML = '<p class="group-page__empty">Ничего не найдено. Попробуйте изменить поиск или фильтр.</p>';
}

export function renderGroupRecipesControls(container, state, onChange = () => {}) {
    SearchFilters.renderSearchFilters(container, {
        placeholder: 'Искать',
        searchAriaLabel: 'Поиск рецептов группы',
        filters: GROUP_RECIPE_FILTERS,
        searchValue: state.searchValue,
        activeFilters: Array.from(state.activeFilters),
        onSearch: (value) => {
            state.searchValue = value;
            onChange();
        },
        onFilterToggle: (_, __, activeFilters) => {
            state.activeFilters = new Set(activeFilters);
            onChange();
        }
    });
}

export function renderGroupRecipesList(container, recipes, state, options = {}) {
    const filteredRecipes = filterGroupRecipes(recipes, state);

    if (!filteredRecipes.length) {
        renderEmptyState(container);
        return;
    }

    RecipeCard.renderRecipeCards(filteredRecipes, container, {
        onFavoriteClick: options.onFavoriteClick || (() => {})
    });
}

