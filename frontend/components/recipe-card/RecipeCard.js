function renderIcon(name, className = '') {
    return window.AppIcons?.render?.(name, className)
        || window.AppIcons?.renderIcon?.(name, className)
        || '';
}

export class RecipeCard {
    constructor(recipe, options = {}) {
        this.recipe = recipe;
        this.onFavoriteClick = options.onFavoriteClick || (() => {
        });
    }

    render() {
        const {id, title, image, time, savingsCount, servings, author, isFavorite} = this.recipe;
        const savedCount = savingsCount ?? servings;

        return `
            <a href="/recipe?id=${id}" class="recipe-card" data-recipe-id="${id}">
                <div class="recipe-card__image-wrapper">
                    <img src="${image}" alt="${title}" class="recipe-card__image">
                    <button type="button" 
                            class="recipe-card__favorite ${isFavorite ? 'recipe-card__favorite--active' : ''}" 
                            data-action="toggle-favorite"
                            aria-pressed="${Boolean(isFavorite)}"
                            title="Добавить в избранное">
                        <span class="recipe-card__favorite-icon" aria-hidden="true">
                            ${renderIcon('bookmark', 'recipe-card__icon recipe-card__icon--bookmark')}
                        </span>
                    </button>
                </div>

                <div class="recipe-card__content">
                    <h3 class="recipe-card__title">${title}</h3>

                    <div class="recipe-card__meta">
                        ${savedCount ? `
                            <div class="recipe-card__meta-item">
                                <span class="recipe-card__meta-icon" aria-hidden="true">
                                    ${renderIcon('bookmark', 'recipe-card__icon recipe-card__icon--bookmark recipe-card__icon--compact')}
                                </span>
                                <span>${savedCount}</span>
                            </div>
                        ` : ''}

                        ${savedCount && time ? `
                            <span class="recipe-card__separator" aria-hidden="true">
                                ${renderIcon('separator', 'recipe-card__icon recipe-card__icon--separator')}
                            </span>
                        ` : ''}

                        ${time ? `
                            <div class="recipe-card__meta-item">
                                <span class="recipe-card__meta-icon recipe-card__meta-icon--time" aria-hidden="true">
                                    ${renderIcon('time', 'recipe-card__icon recipe-card__icon--time')}
                                </span>
                                <span>${time} Мин</span>
                            </div>
                        ` : ''}
                    </div>

                    <p class="recipe-card__author">${author}</p>
                </div>
            </a>
        `;
    }

    bindEvents(container) {
        const element = container.querySelector(`[data-recipe-id="${this.recipe.id}"]`);
        if (!element) return;

        const favoriteBtn = element.querySelector('[data-action="toggle-favorite"]');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.recipe.isFavorite = !this.recipe.isFavorite;
                favoriteBtn.classList.toggle('recipe-card__favorite--active');
                favoriteBtn.setAttribute('aria-pressed', String(this.recipe.isFavorite));
                this.onFavoriteClick(this.recipe);
            });
        }
    }

    static renderRecipeCards(recipes, container, options = {}) {
        const cards = recipes.map(recipe => new RecipeCard(recipe, options));

        container.innerHTML = cards
            .map(card => card.render())
            .join('');

        cards.forEach(card => card.bindEvents(container));

        return cards;
    }
}
