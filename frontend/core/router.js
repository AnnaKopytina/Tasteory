(function () {
    const loadedStyles = new Set();
    const loadingStyles = new Map();
    let intendedUrl = null;

    const routes = {
        '/auth': { title: 'Вход', css: '/auth/auth.css', module: '../auth/auth.js', initKey: 'initAuthPage' },
        '/': { title: 'Главная', css: ['/pages/main/main.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'], module: '../pages/main/main.js', initKey: 'initMainPage' },
        '/main': { title: 'Главная', css: ['/pages/main/main.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'], module: '../pages/main/main.js', initKey: 'initMainPage' },
        '/recipe': { title: 'Рецепт', css: '/pages/recipe/recipe.css', module: '../pages/recipe/recipe.js', initKey: 'initRecipePage' },
        '/create': { title: 'Создать', css: '/pages/create/create.css', module: '../pages/create/create.js', initKey: 'initCreatePage' },
        '/favorite': { title: 'Избранное', css: ['/pages/favorite/favorite.css', '/components/recipe-card/recipe-card.css'], module: '../pages/favorite/favorite.js', initKey: 'initFavoritePage' },
        '/profile': { title: 'Профиль', css: ['/pages/profile/profile.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'], module: '../pages/profile/profile.js', initKey: 'initProfilePage' },
        '/group': { title: 'Группа', css: ['/pages/group/group.css', '/components/recipe-card/recipe-card.css', '/components/search-filters/search-filters.css'], module: '../pages/group/group.js', initKey: 'initGroupPage' }
    };

    const state = {
        contentRoot: null,
        started: false,
        isAuthenticated: null
    };

    function getContentRoot() {
        if (!state.contentRoot) {
            state.contentRoot = document.getElementById('content-root');
        }
        return state.contentRoot;
    }

    function parseUrl(url) {
        const [path, search = ''] = url.split('?');
        return { path, search, params: new URLSearchParams(search) };
    }

    function resolveRoute(path) {
        if (path.startsWith('/group/')) {
            return { routeKey: '/group', route: routes['/group'], dynamicId: path.split('/')[2] || null };
        }
        const routeKey = routes[path] ? path : '/main';
        return { routeKey, route: routes[routeKey], dynamicId: null };
    }

    async function isAuthorized() {
        if (state.isAuthenticated !== null) {
            return state.isAuthenticated;
        }
        try {
            const response = await fetch('/api/auth/status', { method: 'GET', credentials: 'include' });
            state.isAuthenticated = response.ok;
            return state.isAuthenticated;
        } catch (error) {
            state.isAuthenticated = false;
            return false;
        }
    }

    function setAuthState(isAuth) {
        state.isAuthenticated = isAuth;
        window.dispatchEvent(new CustomEvent('auth:changed'));
    }

    function applyLayoutMode(routeKey) {
        if (routeKey === '/auth') {
            document.body.classList.add('auth-route');
        } else {
            document.body.classList.remove('auth-route');
        }
    }

    async function ensureStylesheet(href) {
        if (!href) {
            return;
        }
        if (loadedStyles.has(href)) {
            return;
        }
        if (loadingStyles.has(href)) {
            return loadingStyles.get(href);
        }
        const promise = new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                loadedStyles.add(href);
                loadingStyles.delete(href);
                resolve();
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
        root.innerHTML = `<div class="page-card"><h1>${title}</h1><p>${message}</p><button class="nav-item" data-action="go-home" style="border:1px solid #ccc; margin-top:20px; cursor:pointer">Вернуться на главную</button></div>`;
        const button = root.querySelector('[data-action="go-home"]');
        if (button) {
            button.addEventListener('click', () => {
                navigate('/main');
            });
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
        return pageModule[route.initKey] || pageModule.default || null;
    }

    async function handleJoinRedirect(code, root) {
        root.innerHTML = '<div class="loader">Присоединяемся к группе...</div>';
        try {
            const res = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode: code }),
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                window.dispatchEvent(new CustomEvent('groups:changed'));
                return navigate(`/group/${data.groupId}`, true);
            } else {
                const err = await res.json().catch(() => {
                    return {};
                });
                showError(err.message || 'Неверный или просроченный код приглашения.');
                return;
            }
        } catch (e) {
            showError('Ошибка сети при попытке вступить в группу.');
            return;
        }
    }

    async function renderPage(url, pushState = true) {
        const root = getContentRoot();
        if (!root) return;

        const { path, params } = parseUrl(url);
        const { route, routeKey, dynamicId } = resolveRoute(path);
        applyLayoutMode(routeKey);
        const hasToken = await isAuthorized();
        const protectedRoutes = ['/create', '/favorite', '/profile', '/group'];


        if (protectedRoutes.includes(routeKey) || path.startsWith('/group/')) {
            if (!hasToken) {
                intendedUrl = url;
                alert("Чтобы пользоваться этой функцией, нужно войти в аккаунт.");
                return navigate('/auth', true);
            }
        }
        if (routeKey === '/auth' && hasToken) {
            return navigate('/main', false);
        }

        await executePageRender(route, routeKey, url, root, params, dynamicId, pushState);
    }

    async function executePageRender(route, routeKey, url, root, params, dynamicId, pushState) {
        document.title = route.title;
        applyLayoutMode(routeKey);

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
                return;
            }

            if (routeKey === '/recipe') {
                initFunc(params);
                return;
            }
            if (routeKey === '/create') {
                initFunc(params);
                return;
            }
            if (routeKey === '/group') {
                initFunc(dynamicId);
                return;
            }

            initFunc();
        } catch (error) {
            showError('Не удалось загрузить страницу.');
            console.error(error);
        }
    }

    function handleDocumentClick(event) {
        const link = event.target.closest('a[href], .nav-item[href], .sub-item[href]');
        if (!link) {
            return;
        }
        const url = link.getAttribute('href');
        if (!url || url === '#' || url.startsWith('http') || url.startsWith('javascript:')) {
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
        window.addEventListener('popstate', () => {
            renderPage(window.location.pathname + window.location.search, false);
        });
        renderPage(window.location.pathname + window.location.search, false);
    }

    function navigate(url, pushState = true) {
        return renderPage(url, pushState);
    }

    window.AppRouter = {
        start,
        navigate,
        setAuthState: (isAuth) => {
            state.isAuthenticated = isAuth;
            window.dispatchEvent(new CustomEvent('auth:changed'));
        },
        isAuthorized,
        consumeIntendedUrl: () => {
            const url = intendedUrl;
            intendedUrl = null;
            return url;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();

export const RECIPE_FILTERS = [{ id: 'breakfast', label: 'Завтрак' }, { id: 'lunch', label: 'Обед' }, { id: 'dinner', label: 'Ужин' }];

export function createRecipeFiltersState() {
    return { searchValue: '', activeFilters: new Set() };
}

export function filterRecipes(recipes, state) {
    const searchValue = state?.searchValue?.trim().toLowerCase() || '';
    const activeFilters = state?.activeFilters || new Set();
    return (recipes || []).filter((recipe) => {
        const title = String(recipe?.title || '').toLowerCase();
        const matchesSearch = !searchValue || title.includes(searchValue);
        const matchesFilters = activeFilters.size === 0 || activeFilters.has(recipe?.type);
        return matchesSearch && matchesFilters;
    });
}

(() => {
    function escapeHtml(value) {
        return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    function filenameFromPath(path) {
        if (!path) {
            return '';
        }
        return String(path).split('/').pop() || '';
    }
    function getInitials(fullName) {
        const normalized = String(fullName || '').trim();
        if (!normalized) {
            return '?';
        }
        const parts = normalized.split(/\s+/).filter(Boolean);
        const firstLetter = Array.from(parts[0] || '')[0] || '';
        if (parts.length === 1) {
            return firstLetter.toUpperCase();
        }
        const lastLetter = Array.from(parts[parts.length - 1] || '')[0] || '';
        return `${firstLetter}${lastLetter}`.toUpperCase();
    }
    window.AppUtils = { escapeHtml, clamp, filenameFromPath, getInitials };
})();