export function initMainPage() {
    const root = document.getElementById('content-root');
    root.innerHTML = `
        <section class="page-card main-page">
            <h1>Главная</h1>
            <div class="main-page__feed">
                <a href="/recipe?id=5165161655665" class="recipe-card">
                    <h3>Полезный салат</h3>
                    <span class="recipe-card__action">Открыть рецепт →</span>
                </a>
            </div>
        </section>
    `;
}
