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

    formatISOTime(minutes) {
        return `PT${minutes || 0}M`;
    }

    render() {
        const { id, title, image, time, favoritesCount, author, isFavorite } = this.recipe;
        const groupParam = this.getGroupParam();
        const favActive = isFavorite ? 'recipe-card__favorite--active' : '';

        return `
            <a href="/recipe?id=${id}${groupParam}" 
               class="recipe-card" 
               data-recipe-id="${id}"
               itemscope itemtype="http://schema.org/Recipe">
                
                ${this.renderImageSection(image, favActive).trim()}
                ${this.renderContentSection().trim()}
            </a>
        `.trim();
    }

    getGroupParam() {
        return this.options.groupId ? `&groupId=${this.options.groupId}` : '';
    }

    renderImageSection(image, favActive) {
        const currentId = window.currentUserId || localStorage.getItem('userId');
        const authorId = this.recipe.authorId || this.recipe.AuthorId;

        const isAuthor = currentId && authorId &&
            String(authorId).toLowerCase() === String(currentId).toLowerCase();

        return `
        <div class="recipe-card__image-wrapper">
            <img src="${image || '/components/recipe-card/no-photo.png'}" 
                 class="recipe-card__image" 
                 itemprop="image"
                 alt="${this.recipe.title}">
            
            <div class="recipe-card__actions">
                ${isAuthor ? `
                    <button type="button" 
                            class="recipe-card__btn recipe-card__edit" 
                            title="Редактировать"
                            onclick="event.preventDefault(); event.stopPropagation(); window.AppRouter.navigate('/create?editId=${this.recipe.id}')">
                        ${renderIcon('edit', 'recipe-card__icon')}
                    </button>
                ` : ''}
                
                <button type="button" 
                        class="recipe-card__btn recipe-card__favorite ${favActive}" 
                        data-action="toggle-favorite">
                    <span class="recipe-card__favorite-icon">
                        ${renderIcon('bookmark', 'recipe-card__icon recipe-card__icon--bookmark')}
                    </span>
                </button>
            </div>
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

    renderContentSection() {
        const { title, favoritesCount, time, author } = this.recipe;

        return `
            <div class="recipe-card__content">
                <h3 class="recipe-card__title" itemprop="name">${title}</h3>
                
                <div class="recipe-card__meta">
                    <div class="recipe-card__meta-item" 
                         itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating">
                        <meta itemprop="ratingValue" content="5">
                        <meta itemprop="bestRating" content="5">
                        <span class="recipe-card__meta-icon">${renderIcon('bookmark', 'recipe-card__icon recipe-card__icon--compact')}</span>
                        <span data-role="fav-count" itemprop="ratingCount">${favoritesCount || 0}</span>
                    </div>
                    
                    <span class="recipe-card__separator">${renderIcon('separator', 'recipe-card__icon')}</span>
                    
                    <div class="recipe-card__meta-item">
                        <span class="recipe-card__meta-icon">${renderIcon('time', 'recipe-card__icon')}</span>
                        <meta itemprop="prepTime" content="${this.formatISOTime(time)}">
                        <span>${time || 0} Мин</span>
                    </div>
                </div>
                
                <p class="recipe-card__author">
                    <span itemprop="author" itemscope itemtype="http://schema.org/Person">
                        <span itemprop="name">${author || 'Автор'}</span>
                    </span>
                </p>
            </div>
        `;
    }

    async handleToggleFavorite(e, favoriteBtn, countSpan) {
        e.preventDefault();
        e.stopPropagation();

        const isAuth = await window.AppRouter.isAuthorized();
        if (!isAuth) {
            alert("Чтобы сохранять рецепты в избранное, нужно войти в аккаунт!");
            return;
        }

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
            } else if (res.status === 401) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
                window.AppRouter.navigate('/auth');
            }
        } catch (err) {
            console.error('Ошибка при смене статуса избранного:', err);
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