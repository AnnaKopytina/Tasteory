    export const RECIPE_FILTERS = [
        { id: 'breakfast', label: 'Завтрак' },
        { id: 'lunch', label: 'Обед' },
        { id: 'dinner', label: 'Ужин' }
    ];

    export function createRecipeFiltersState() {
        return {
            searchValue: '',
            activeFilters: new Set()
        };
    }

    export function filterRecipes(recipes, state) {
        const searchValue = state?.searchValue?.trim().toLowerCase() || '';
        const activeFilters = state?.activeFilters || new Set();
        const recipeList = Array.isArray(recipes) ? recipes : [];

        return recipeList.filter((recipe) => {
            const title = String(recipe?.title || '').toLowerCase();
            const author = String(recipe?.author || '').toLowerCase();
            const matchesSearch = !searchValue || title.includes(searchValue) || author.includes(searchValue);
            const matchesFilters = activeFilters.size === 0 || activeFilters.has(recipe?.type);

            return matchesSearch && matchesFilters;
        });
    }

