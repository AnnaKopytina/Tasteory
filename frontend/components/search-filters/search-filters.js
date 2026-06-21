export class SearchFilters {
    static instanceCounter = 0;

    constructor(options = {}) {
        this.placeholder = options.placeholder ?? options.label ?? 'Искать';
        this.searchAriaLabel = options.searchAriaLabel ?? 'Поиск рецептов';
        this.filters = options.filters ?? [
            { id: 'breakfast', label: 'Завтрак' },
            { id: 'lunch', label: 'Обед' },
            { id: 'dinner', label: 'Ужин' }
        ];
        this.activeFilters = new Set(options.activeFilters ?? []);
        this.searchValue = options.searchValue ?? '';
        this.onSearch = options.onSearch ?? (() => {});
        this.onFilterToggle = options.onFilterToggle ?? (() => {});
        this.inputId = options.inputId ?? `search-filters-input-${SearchFilters.instanceCounter += 1}`;
    }

    render() {
        const isAllActive = this.activeFilters.size === 0;

        return `
        <section class="search-filters" data-search-filters>
            <div class="search-filters__search">
                <input
                    id="${this.inputId}"
                    class="search-filters__input"
                    type="search"
                    value="${this.escapeHtml(this.searchValue)}"
                    placeholder="${this.escapeHtml(this.placeholder)}"
                    aria-label="${this.escapeHtml(this.searchAriaLabel)}"
                />
            </div>
            <div class="search-filters__filters" aria-label="Фильтры по типу рецепта">
                <button
                    class="search-filters__button search-filters__button--all ${isAllActive ? 'is-active-all' : ''}"
                    type="button"
                    data-filter="all"
                >
                    Все
                </button>
                
                ${this.filters.map((filter) => `
                    <button
                        class="search-filters__button ${this.activeFilters.has(filter.id) ? 'is-active' : ''}"
                        type="button"
                        data-filter="${this.escapeHtml(filter.id)}"
                        aria-pressed="${String(this.activeFilters.has(filter.id))}"
                    >
                        ${this.escapeHtml(filter.label)}
                    </button>
                `).join('')}
            </div>
        </section>
    `;
    }

    bindEvents(container) {
        if (!container) {
            return;
        }

        const root = container.querySelector('[data-search-filters]');
        if (!root) {
            return;
        }

        const input = root.querySelector('.search-filters__input');
        if (input) {
            input.addEventListener('input', (event) => {
                this.searchValue = event.target.value;
                this.onSearch(this.searchValue);
            });
        }

        root.querySelectorAll('.search-filters__button').forEach((button) => {
            button.addEventListener('click', () => {
                const filterId = button.getAttribute('data-filter');
                if (!filterId) return;

                if (filterId === 'all') {
                    this.activeFilters.clear();
                } else {
                    const isActive = this.activeFilters.has(filterId);
                    if (isActive) {
                        this.activeFilters.delete(filterId);
                    } else {
                        this.activeFilters.add(filterId);
                    }
                }

                this.onFilterToggle(filterId, true, Array.from(this.activeFilters));
                this.updateButtonStates(root);
            });
        });
    }

    updateButtonStates(root) {
        const isAllActive = this.activeFilters.size === 0;
        const allBtn = root.querySelector('.search-filters__button--all');
        if (allBtn) {
            allBtn.classList.toggle('is-active-all', isAllActive);
        }

        root.querySelectorAll('[data-filter]').forEach(btn => {
            const id = btn.getAttribute('data-filter');
            if (id !== 'all') {
                const active = this.activeFilters.has(id);
                btn.classList.toggle('is-active', active);
            }
        });
    }

    static renderSearchFilters(container, options = {}) {
        if (!container) {
            return null;
        }

        const instance = new SearchFilters(options);
        container.innerHTML = instance.render();
        instance.bindEvents(container);
        return instance;
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
}


