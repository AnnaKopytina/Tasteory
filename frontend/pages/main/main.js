window.initMainPage = function() {
    const root = document.getElementById('content-root');
    root.innerHTML = `
        <div class="page-card">
            <h1>Главная лента</h1>
            <div style="display: grid; gap: 20px; margin-top: 20px;">
                <!-- Ссылка на рецепт -->
                <a href="/recipe?id=5165161655665" class="recipe-card" style="text-decoration: none; color: inherit; border: 1px solid #eee; padding: 15px; border-radius: 20px; display: block;">
                    <h3>Полезный салат (Кликни меня)</h3>
                    <p>Лучший рецепт весны...</p>
                </a>
            </div>
        </div>
    `;
};