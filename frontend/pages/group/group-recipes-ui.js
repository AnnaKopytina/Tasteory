import { SearchFilters } from '../../components/search-filters/search-filters.js';
import { RecipeCard } from '../../components/recipe-card/recipe-card.js';
import { RECIPE_FILTERS as GROUP_RECIPE_FILTERS } from '../../core/recipe-filters.js';

export function renderGroupRecipesControls(container, state, onChange = () => { }) {
    SearchFilters.renderSearchFilters(container, {
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
    RecipeCard.renderRecipeCards(recipes, container, options);
}