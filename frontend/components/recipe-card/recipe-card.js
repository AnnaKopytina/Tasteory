function renderIcon(name, className = '') {
    const icon = window.AppIcons?.render?.(name, className) || window.AppIcons?.renderIcon?.(name, className);
    if (icon) {
        return icon;
    }
    return '';
}

export class RecipeCard {
    constructor(recipe, options = {}) {
        this.recipe = recipe;
        this.options = options;
        this.onFavoriteClick = options.onFavoriteClick || (() => {});
    }

    render() {
        const { id, title, image, time, favoritesCount, author, isFavorite } = this.recipe;
        const groupParam = this.getGroupParam();
        const favActive = isFavorite ? 'recipe-card__favorite--active' : '';

        return `
            <a href="/recipe?id=${id}${groupParam}" class="recipe-card" data-recipe-id="${id}">
                ${this.renderImageSection(image, favActive).trim()}
                ${this.renderContentSection(title, favoritesCount, time, author).trim()}
            </a>
        `.trim();
    }

    getGroupParam() {
        if (this.options.groupId) {
            return `&groupId=${this.options.groupId}`;
        }
        return '';
    }

    renderImageSection(image, favActive) {
        return `
            <div class="recipe-card__image-wrapper">
                <img src="${image || '/assets/no-photo.png'}" class="recipe-card__image">
                <button type="button" 
                        class="recipe-card__favorite ${favActive}" 
                        data-action="toggle-favorite">
                    <span class="recipe-card__favorite-icon">
                        ${renderIcon('bookmark', 'recipe-card__icon recipe-card__icon--bookmark')}
                    </span>
                </button>
            </div>
        `;
    }

    renderContentSection(title, favoritesCount, time, author) {
        return `
            <div class="recipe-card__content">
                <h3 class="recipe-card__title">${title}</h3>
                <div class="recipe-card__meta">
                    <div class="recipe-card__meta-item">
                        <span class="recipe-card__meta-icon">${renderIcon('bookmark', 'recipe-card__icon recipe-card__icon--compact')}</span>
                        <span data-role="fav-count">${favoritesCount || 0}</span>
                    </div>
                    <span class="recipe-card__separator">${renderIcon('separator', 'recipe-card__icon')}</span>
                    <div class="recipe-card__meta-item">
                        <span class="recipe-card__meta-icon">${renderIcon('time', 'recipe-card__icon')}</span>
                        <span>${time || 0} Мин</span>
                    </div>
                </div>
                <p class="recipe-card__author">${author || 'Автор'}</p>
            </div>
        `;
    }

    bindEvents(container) {
        const element = container.querySelector(`[data-recipe-id="${this.recipe.id}"]`);
        if (!element) {
            return;
        }

        const favoriteBtn = element.querySelector('[data-action="toggle-favorite"]');
        const countSpan = element.querySelector('[data-role="fav-count"]');

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', async (e) => {
                await this.handleToggleFavorite(e, favoriteBtn, countSpan);
            });
        }
    }

    async handleToggleFavorite(e, favoriteBtn, countSpan) {
        e.preventDefault();
        e.stopPropagation();

        const isAdding = !this.recipe.isFavorite;
        const method = isAdding ? 'POST' : 'DELETE';

        try {
            const res = await fetch(`/api/favorites/${this.recipe.id}`, {
                method: method,
                credentials: 'include'
            });

            if (res.ok) {
                this.updateFavoriteState(isAdding);
                this.updateFavoriteUI(favoriteBtn, countSpan, isAdding);
                this.onFavoriteClick(this.recipe);
            }
        } catch (err) {
            console.error(err);
        }
    }

    updateFavoriteState(isAdding) {
        this.recipe.isFavorite = isAdding;
        if (isAdding) {
            this.recipe.favoritesCount += 1;
        } else {
            this.recipe.favoritesCount -= 1;
        }
    }

    updateFavoriteUI(favoriteBtn, countSpan, isAdding) {
        favoriteBtn.classList.toggle('recipe-card__favorite--active', isAdding);
        if (countSpan) {
            countSpan.textContent = this.recipe.favoritesCount;
        }
    }

    static renderRecipeCards(recipes, container, options = {}) {
        const cards = recipes.map((recipe) => {
            return new RecipeCard(recipe, options);
        });
        container.innerHTML = cards.map((card) => {
            return card.render();
        }).join('');
        cards.forEach((card) => {
            card.bindEvents(container);
        });
        return cards;
    }
}