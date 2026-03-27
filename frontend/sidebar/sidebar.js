document.addEventListener('DOMContentLoaded', async () => {
    const contentRoot = document.getElementById('content-root');
    const groupsList = document.getElementById('groups-list');
    const addGroupBtn = document.getElementById('add-group-btn');
    const toggleGroupsBtn = document.getElementById('toggle-groups');
    const navGroupContainer = document.querySelector('.nav-group');

    let groupsData = [];

    async function loadAndRenderGroups() {
        groupsData = await ApiService.getMyGroups();
        renderGroups();
    }

    function renderGroups() {
        groupsList.innerHTML = '';
        groupsData.forEach(group => {
            const item = document.createElement('a');
            item.href = `/group/${group.id}`;
            item.className = 'sub-item';
            item.setAttribute('data-page', group.name);
            item.innerHTML = `
                <img class="icon" src="/svg/sidebar/group.svg">
                <span>${group.name}</span>
            `;
            groupsList.appendChild(item);
        });
    }

    // ОТКРЫТИЕ / ЗАКРЫТИЕ СПИСКА
    toggleGroupsBtn.addEventListener('click', async () => {
        navGroupContainer.classList.toggle('active');
        if (navGroupContainer.classList.contains('active')) {
            await loadAndRenderGroups();
            groupsList.style.display = 'flex';
        } else {
            groupsList.style.display = 'none';
        }
    });

    // СОЗДАНИЕ НОВОЙ ГРУППЫ
    addGroupBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        navGroupContainer.classList.add('active');
        groupsList.style.display = 'flex';
        renderGroups();
    });


    // НАВИГАЦИЯ
    function renderPage(title, url, pushState = true) {
        if (pushState && window.location.pathname !== url) {
            window.history.pushState({}, title, url);
        }

        contentRoot.innerHTML = `
            <div class="page-card">
                <h1>${title}</h1>
                <p>Вы находитесь на странице: <strong>${url}</strong></p>
            </div>
        `;

        document.querySelectorAll('.nav-item, .sub-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('href') === url) el.classList.add('active');
        });
    }

    document.querySelector('.side-nav').addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (link && !link.id.includes('toggle-groups')) {
            e.preventDefault();
            renderPage(link.getAttribute('data-page'), link.getAttribute('href'));
        }
    });

    window.addEventListener('popstate', () => {
        handleInitialRoute();
    });

    function handleInitialRoute() {
        const path = window.location.pathname;

        if (path.startsWith('/group/')) {
            navGroupContainer.classList.add('active');
            groupsList.style.display = 'flex';
            renderGroups();
        }

        const activeLink = document.querySelector(`.side-nav a[href="${path}"]`);
        if (activeLink) {
            const title = activeLink.getAttribute('data-page');
            renderPage(title, path, false);
        } else {
            renderPage('Главная', '/main', false);
        }
    }

    if (window.location.pathname.startsWith('/group/')) {
        await loadAndRenderGroups();
    }
    handleInitialRoute();
});