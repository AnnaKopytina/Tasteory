document.addEventListener('DOMContentLoaded', async () => {
    const contentRoot = document.getElementById('content-root');
    const groupsList = document.getElementById('groups-list');
    const toggleGroupsBtn = document.getElementById('toggle-groups');
    const navGroupContainer = document.querySelector('.nav-group');

    const routes = {
        '/': { title: 'Главная', init: 'initMainPage', js: '/pages/main/main.js' },
        '/main':     { title: 'Главная',    init: 'initMainPage',     js: '/pages/main/main.js',     css: '/pages/main/main.css' },
        '/recipe':   { title: 'Рецепт',     init: 'initRecipePage',   js: '/pages/recipe/recipe.js', css: '/pages/recipe/recipe.css' },
        '/create':   { title: 'Создать',    init: 'initCreatePage',   js: '/pages/create/create.js', css: '/pages/create/create.css' },
        '/favorite': { title: 'Избранное',  init: 'initFavoritePage', js: '/pages/fav/fav.js' },
        '/profile':  { title: 'Профиль',    init: 'initProfilePage',  js: '/pages/profile/profile.js' },
        '/group':    { title: 'Группа',     init: 'initGroupPage',    js: '/pages/group/group.js' }
    };

    async function renderPage(url, pushState = true) {
        const path = url.split('?')[0];
        const search = url.split('?')[1] || '';
        const params = new URLSearchParams(search);

        let routeKey = path;
        let dynamicId = null;

        if (path.startsWith('/group/')) {
            routeKey = '/group';
            dynamicId = path.split('/')[2];
        }

        const route = routes[routeKey] || routes['/main'];

        if (pushState && window.location.pathname + window.location.search !== url) {
            window.history.pushState({}, route.title, url);
        }

        updateActiveState(url);
        contentRoot.innerHTML = '<div class="loader">Загрузка...</div>'; // Показываем лоадер

        try {
            await loadResource(route);
            contentRoot.innerHTML = '';
            const initFunc = window[route.init];

            console.log("Loaded route:", route);
            console.log("Init function:", window[route.init]);

            if (typeof initFunc === 'function') {
                if (routeKey === '/recipe') {
                    initFunc(params.get('id'));
                } else if (routeKey === '/group') {
                    initFunc(dynamicId);
                } else {
                    initFunc();
                }
            } else {
                showError(`Функция ${route.init} не найдена в файле ${route.js}`);
            }
        } catch (e) {
            console.error("Render Error:", e);
            showError("Не удалось загрузить модуль страницы. Проверьте пути к файлам.");
        }
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

    async function loadResource(route) {
        if (route.css && !document.querySelector(`link[href="${route.css}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = route.css;
            document.head.appendChild(link);
        }

        if (route.js && !document.querySelector(`script[src="${route.js}"]`)) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = route.js;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        }
    }

    function searchIndex(url) { return url.indexOf('?') !== -1 ? 1 : -1; }

    function updateActiveState(currentUrl) {
        document.querySelectorAll('.nav-item, .sub-item').forEach(el => {
            el.classList.remove('active');
            const href = el.getAttribute('href');
            if (href && currentUrl.startsWith(href)) {
                el.classList.add('active');
            }
        });
    }

    function showError(message, title = "Упс!") {
        contentRoot.innerHTML = `
            <div class="page-card">
                <h1>${title}</h1>
                <p>${message}</p>
                <button class="nav-item" onclick="window.location.href='/main'" style="border:1px solid #ccc; margin-top:20px; cursor:pointer">Вернуться на главную</button>
            </div>`;
    }

    // --- ГРУППЫ ---

    async function loadAndRenderGroups() {
        const groupsData = await ApiService.getMyGroups();
        groupsList.innerHTML = '';
        groupsData.forEach(group => {
            const item = document.createElement('a');
            item.href = `/group/${group.id}`;
            item.className = 'sub-item';
            item.setAttribute('data-page', group.name); // Для совместимости с кликами
            item.innerHTML = `
                <img class="icon" src="/svg/sidebar/group.svg">
                <span>${group.name}</span>
            `;
            groupsList.appendChild(item);
        });
    }

    toggleGroupsBtn.addEventListener('click', async () => {
        navGroupContainer.classList.toggle('active');
        if (navGroupContainer.classList.contains('active')) {
            await loadAndRenderGroups();
            groupsList.style.display = 'flex';
        } else {
            groupsList.style.display = 'none';
        }
    });

    // --- ОБРАБОТКА КЛИКОВ ---

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href], .nav-item[href], .sub-item[href]');

        if (link) {
            const url = link.getAttribute('href');

            if (url.startsWith('http') || link.id === 'toggle-groups' || link.closest('#toggle-groups')) return;

            e.preventDefault();
            renderPage(url);
        }
    });

    window.addEventListener('popstate', () => {
        renderPage(window.location.pathname + window.location.search, false);
    });

    // --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ---

    if (window.location.pathname.startsWith('/group/')) {
        navGroupContainer.classList.add('active');
        groupsList.style.display = 'flex';
        await loadAndRenderGroups();
    }

    renderPage(window.location.pathname + window.location.search, false);
});