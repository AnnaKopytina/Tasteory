export const RECIPE_FILTERS = [
    { id: 'завтрак', label: 'Завтрак' },
    { id: 'обед', label: 'Обед' },
    { id: 'ужин', label: 'Ужин' },
    { id: 'суп', label: 'Суп' },
    { id: 'десерт', label: 'Десерт' },
    { id: 'выпечка', label: 'Выпечка' },
    { id: 'пп', label: 'Здоровое питание' }
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
        const matchesSearch = !searchValue || title.includes(searchValue);
        const matchesFilters = activeFilters.size === 0 || 
            (recipe.tags && recipe.tags.some(tag => activeFilters.has(tag.toLowerCase())));

        return matchesSearch && matchesFilters;
    });
}