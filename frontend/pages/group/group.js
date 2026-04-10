export function initGroupPage(groupId) {
    const root = document.getElementById('content-root');
    root.innerHTML = `
        <section class="page-card group-page">
            <h1>Группа</h1>
            <p class="page-description">Карточка для группы № <strong>${groupId || '—'}</strong>.</p>

            <div class="group-page__panel">
                <h2>Контент группы</h2>
                <p>Здесь появятся рецепты, участники и действия группы.</p>
            </div>
        </section>
    `;
}
