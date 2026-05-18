function createIcon(iconName, className = '') {
    if (typeof renderIcon !== 'function') return null;
    const html = renderIcon(iconName, className);
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html.trim(), 'text/html');
    return doc.body.firstElementChild;
}

function processIconElement(element) {
    const iconName = element.getAttribute('data-icon');
    const svg = createIcon(iconName, element.className);
    if (svg) {
        if (element.id) svg.id = element.id;
        if (element.title) svg.setAttribute('title', element.title);
        svg.removeAttribute('data-icon');
        element.replaceWith(svg);
    }
}

function initIcons() {
    document.querySelectorAll('[data-icon]').forEach(processIconElement);
}

const groupsList = document.getElementById('groups-list');
const toggleGroupsBtn = document.getElementById('toggle-groups');
const addGroupBtn = document.getElementById('add-group-btn');
const navGroupContainer = document.querySelector('.nav-group');

async function fetchGroupsData() {
    const response = await fetch('/api/users/me/groups?page=1&pageSize=50', {
        method: 'GET',
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Ошибка сети');
    return await response.json();
}

async function loadAndRenderGroups() {
    if (!groupsList) return;

    const loader = document.createElement('div');
    loader.className = 'sub-item';
    loader.style.fontSize = '14px';
    loader.style.opacity = '0.7';
    loader.textContent = 'Загрузка...';
    groupsList.replaceChildren(loader);

    try {
        const data = await fetchGroupsData();
        const groupsData = data.items || [];

        groupsList.replaceChildren();

        if (!groupsData.length) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'sub-item';
            emptyMessage.style.fontSize = '14px';
            emptyMessage.textContent = 'Пока групп нет';
            groupsList.appendChild(emptyMessage);
            return;
        }

        groupsData.forEach(g => {
            const item = document.createElement('a');
            item.href = `/group/${g.id}`;
            item.className = 'sub-item';
            const icon = createIcon('group', 'icon');
            const label = document.createElement('span');
            label.textContent = g.name;
            if (icon) item.append(icon);
            item.append(label);
            groupsList.appendChild(item);
        });
    } catch (error) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'sub-item';
        errorMessage.style.color = 'red';
        errorMessage.style.fontSize = '12px';
        errorMessage.textContent = 'Ошибка загрузки';
        groupsList.replaceChildren(errorMessage);
    }
}

async function updateSidebarUI() {
    const isAuth = await window.AppRouter.isAuthorized();

    const profileLinks = document.querySelectorAll('a[data-page="Профиль"], #mobile-profile-link');
    profileLinks.forEach(link => {
        const labelSpan = link.querySelector('span:last-child');
        if (!isAuth) {
            link.href = '/auth';
            if (labelSpan) labelSpan.textContent = 'Вход/Регистрация';
        } else {
            link.href = '/profile';
            if (labelSpan) labelSpan.textContent = 'Профиль';
        }
    });

    const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (!isAuth) {
            if (href === '/auth') {
                item.style.color = '#f28c50';
            } else if (href === '/main' || href === '/') {
                item.style.color = '#0a2533';
            } else {
                item.style.color = '#7c8a98';
            }
        } else {
            item.style.color = '#0a2533';
        }
    });

    if (addGroupBtn) addGroupBtn.style.display = isAuth ? 'inline-flex' : 'none';
    if (!isAuth && navGroupContainer) {
        navGroupContainer.classList.remove('active');
        if (groupsList) groupsList.replaceChildren();
    }

    const isGroupPage = window.location.pathname.includes('/group/');
    if (isGroupPage && isAuth && navGroupContainer) {
        navGroupContainer.classList.add('active');
        loadAndRenderGroups();
    }
}

document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-item, .mobile-nav-item, .sub-item, #toggle-groups');
    if (!link) return;

    const href = link.getAttribute('href');
    const isProtected = href && (href.includes('/create') || href.includes('/favorite') || href.includes('/group'));
    const isGroupToggle = link.id === 'toggle-groups' || link.closest('#toggle-groups');

    if (isProtected || isGroupToggle) {
        e.preventDefault();
        e.stopImmediatePropagation();

        window.AppRouter.isAuthorized().then(isAuth => {
            if (!isAuth) {
                alert("Чтобы пользоваться этой функцией, нужно войти в аккаунт.");
            } else {
                if (isGroupToggle) {
                    const isOpen = !navGroupContainer.classList.contains('active');
                    navGroupContainer.classList.toggle('active', isOpen);
                    if (isOpen) loadAndRenderGroups();
                } else if (href) {
                    window.AppRouter.navigate(href);
                }
            }
        });
    }
}, true);

initIcons();
updateSidebarUI();

if (addGroupBtn) {
    addGroupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.GroupCreateModal?.open({onCreated: () => loadAndRenderGroups().catch(console.error)});
    });
}

window.addEventListener('auth:changed', updateSidebarUI);