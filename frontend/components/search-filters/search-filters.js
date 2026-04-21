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
                if (!filterId) {
                    return;
                }

                const isActive = this.activeFilters.has(filterId);
                if (isActive) {
                    this.activeFilters.delete(filterId);
                } else {
                    this.activeFilters.add(filterId);
                }

                button.classList.toggle('is-active', !isActive);
                button.setAttribute('aria-pressed', String(!isActive));
                this.onFilterToggle(filterId, !isActive, Array.from(this.activeFilters));
            });
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


