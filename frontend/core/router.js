(function () {
    const loadedStyles = new Set();
    const loadingStyles = new Map();

    const routes = {
        '/': { title: 'Главная', css: ['/pages/main/main.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'], module: '../pages/main/main.js', initKey: 'initMainPage' },
        '/main': { title: 'Главная', css: ['/pages/main/main.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'], module: '../pages/main/main.js', initKey: 'initMainPage' },
        '/recipe': { title: 'Рецепт', css: '/pages/recipe/recipe.css', module: '../pages/recipe/recipe.js', initKey: 'initRecipePage' },
        '/create': { title: 'Создать', css: '/pages/create/create.css', module: '../pages/create/create.js', initKey: 'initCreatePage' },
        '/favorite': {
            title: 'Избранное',
            css: ['/pages/favorite/favorite.css', '/components/recipe-card/recipe-card.css'],
            module: '../pages/favorite/favorite.js',
            initKey: 'initFavoritePage'
        },
        '/profile': {
            title: 'Профиль',
            css: ['/pages/profile/profile.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'],
            module: '../pages/profile/profile.js',
            initKey: 'initProfilePage'
        },
        '/group': {
            title: 'Группа',
            css: ['/pages/group/group.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'],
            module: '../pages/group/group.js',
            initKey: 'initGroupPage'
        }
    };

    const state = {
        contentRoot: null,
        started: false
    };

    function getContentRoot() {
        if (!state.contentRoot) {
            state.contentRoot = document.getElementById('content-root');
        }

        return state.contentRoot;
    }

    function parseUrl(url) {
        const [path, search = ''] = url.split('?');
        return {
            path,
            search,
            params: new URLSearchParams(search)
        };
    }

    function resolveRoute(path) {
        if (path.startsWith('/group/')) {
            return {
                routeKey: '/group',
                route: routes['/group'],
                dynamicId: path.split('/')[2] || null
            };
        }

        const routeKey = routes[path] ? path : '/main';
        return {
            routeKey,
            route: routes[routeKey],
            dynamicId: null
        };
    }

    async function ensureStylesheet(href) {
        if (!href) {
            return;
        }

        if (loadedStyles.has(href)) {
            loadedStyles.add(href);
            return;
        }

        if (loadingStyles.has(href)) {
            return loadingStyles.get(href);
        }

        if (document.querySelector(`link[href="${href}"]`)) {
            loadedStyles.add(href);
            return;
        }

        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                loadedStyles.add(href);
                loadingStyles.delete(href);
                resolve();
            };
            link.onerror = (error) => {
                loadingStyles.delete(href);
                reject(error);
            };
            document.head.appendChild(link);
        });

        loadingStyles.set(href, promise);
        return promise;
    }

    function updateActiveState(currentUrl) {
        document.querySelectorAll('.nav-item, .sub-item').forEach((el) => {
            el.classList.remove('active');
            const href = el.getAttribute('href');
            if (href && currentUrl.startsWith(href)) {
                el.classList.add('active');
            }
        });
    }

    function showError(message, title = 'Упс!') {
        const root = getContentRoot();
        if (!root) {
            return;
        }

        root.innerHTML = `
            <div class="page-card">
                <h1>${title}</h1>
                <p>${message}</p>
                <button class="nav-item" data-action="go-home" style="border:1px solid #ccc; margin-top:20px; cursor:pointer">Вернуться на главную</button>
            </div>
        `;

        const button = root.querySelector('[data-action="go-home"]');
        if (button) {
            button.addEventListener('click', () => navigate('/main'));
        }
    }

    async function loadRouteAssets(route) {
        const cssFiles = Array.isArray(route.css) ? route.css : [route.css];
        await Promise.all(cssFiles.filter(Boolean).map(ensureStylesheet));
    }

    function resolveInitFn(route, pageModule) {
        if (!route || !pageModule) {
            return null;
        }

        if (route.initKey && typeof pageModule[route.initKey] === 'function') {
            return pageModule[route.initKey];
        }

        return pageModule.default || null;
    }

    async function renderPage(url, pushState = true) {
        const root = getContentRoot();
        if (!root) {
            return;
        }

        const { path, params } = parseUrl(url);
        const { route, routeKey, dynamicId } = resolveRoute(path);

        document.title = route.title;

        if (pushState && window.location.pathname + window.location.search !== url) {
            window.history.pushState({}, route.title, url);
        }

        updateActiveState(url);
        root.innerHTML = '<div class="loader">Загрузка...</div>';

        try {
            await loadRouteAssets(route);
            const pageModule = await import(route.module);
            root.innerHTML = '';

            const initFunc = resolveInitFn(route, pageModule);
            if (typeof initFunc !== 'function') {
                showError(`init-функция не найдена для маршрута ${routeKey}`);
                return;
            }

            if (routeKey === '/recipe') {
                initFunc(params.get('id'));
                return;
            }

            if (routeKey === '/group') {
                initFunc(dynamicId);
                return;
            }

            initFunc();
        } catch (error) {
            console.error('Render Error:', error);
            showError('Не удалось загрузить модуль страницы. Проверьте пути к файлам.');
        }
    }

    function handleDocumentClick(event) {
        const link = event.target.closest('a[href], .nav-item[href], .sub-item[href]');
        if (!link) {
            return;
        }

        const url = link.getAttribute('href');
        if (!url || url.startsWith('http')) {
            return;
        }

        event.preventDefault();
        navigate(url);
    }

    function start() {
        if (state.started) {
            return;
        }

        state.started = true;
        document.addEventListener('click', handleDocumentClick);
        window.addEventListener('popstate', () => renderPage(window.location.pathname + window.location.search, false));
        renderPage(window.location.pathname + window.location.search, false);
    }

    function navigate(url, pushState = true) {
        return renderPage(url, pushState);
    }

    window.AppRouter = { start };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();





