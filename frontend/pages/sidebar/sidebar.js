(() => {
    const renderIcon = window.AppIcons?.render;

    function createIcon(iconName, className = '') {
        if (!renderIcon) {
            return null;
        }
        const html = renderIcon(iconName, className);
        if (!html) {
            return null;
        }
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    }

    function processIconElement(element) {
        const iconName = element.getAttribute('data-icon');
        const svg = createIcon(iconName, element.className);
        if (!svg) {
            return;
        }
        if (element.id) {
            svg.id = element.id;
        }
        if (element.title) {
            svg.setAttribute('title', element.title);
        }
        svg.removeAttribute('data-icon');
        element.replaceWith(svg);
    }

    function replaceSidebarIconsWithSvg() {
        document.querySelectorAll('.sidebar [data-icon]').forEach(processIconElement);
    }

    replaceSidebarIconsWithSvg();

    const groupsList = document.getElementById('groups-list');
    const toggleGroupsBtn = document.getElementById('toggle-groups');
    const addGroupBtn = document.getElementById('add-group-btn');
    const navGroupContainer = document.querySelector('.nav-group');

    if (!groupsList || !toggleGroupsBtn || !addGroupBtn || !navGroupContainer) {
        return;
    }

    function setGroupsVisibility(isVisible) {
        navGroupContainer.classList.toggle('active', isVisible);
    }

    function renderGroupItem(group) {
        const item = document.createElement('a');
        item.href = `/group/${group.id}`;
        item.className = 'sub-item';

        const icon = createIcon('group', 'icon');
        const label = document.createElement('span');
        label.textContent = group.name;

        if (icon) {
            item.append(icon);
        }
        item.append(label);
        return item;
    }

    async function loadAndRenderGroups() {
        groupsList.innerHTML = '<div class="sub-item" style="font-size:14px; opacity:0.7">Загрузка...</div>';
        try {
            const data = await fetchGroupsData();
            const groupsData = data.items || [];
            groupsList.innerHTML = '';
            if (!groupsData.length) {
                const empty = document.createElement('div');
                empty.className = 'sub-item';
                empty.style.fontSize = '14px';
                empty.textContent = 'Пока групп нет';
                groupsList.appendChild(empty);
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
            groupsList.innerHTML = '<div class="sub-item" style="color:red; font-size:12px">Ошибка загрузки</div>';
        }
    }

    async function fetchGroupsData() {
        const response = await fetch('/api/users/me/groups?page=1&pageSize=50', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Ошибка сети');
        }
        return await response.json();
    }

    function renderEmptyGroupsState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'sub-item';
        emptyState.style.fontSize = '14px';
        emptyState.textContent = 'Пока групп нет';
        groupsList.appendChild(emptyState);
    }

    function renderGroupsList(groupsData) {
        groupsData.forEach((group) => {
            groupsList.appendChild(renderGroupItem(group));
        });
    }

    async function updateSidebarUI() {
        const isAuth = await window.AppRouter.isAuthorized();
        const sidebar = document.querySelector('.sidebar');

        if (!isAuth) {
            groupsList.innerHTML = '';
            navGroupContainer.classList.remove('active');
        }

        const profileLink = sidebar.querySelector('a[data-page="Профиль"]');
        if (profileLink) {
            if (!isAuth) {
                profileLink.href = '/auth'; // Важно: меняем на публичный путь
                profileLink.querySelector('span:last-child').textContent = 'Вход/Регистрация';
            } else {
                profileLink.href = '/profile';
                profileLink.querySelector('span:last-child').textContent = 'Профиль';
            }
        }

        const navItems = sidebar.querySelectorAll('.nav-item');
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

        addGroupBtn.style.display = isAuth ? 'inline-flex' : 'none';
    }


    document.querySelector('.side-nav').addEventListener('click', async (e) => {
        const link = e.target.closest('.nav-item, .sub-item');
        if (!link) return;

        const isAuth = await window.AppRouter.isAuthorized();
        const href = link.getAttribute('href');

        const isProtected = href && (href.includes('/create') || href.includes('/favorite') || href.includes('/group'));
        const isGroupToggle = e.target.closest('#toggle-groups');


        if (!isAuth && (isProtected || isGroupToggle)) {
            e.preventDefault();
            e.stopPropagation();
            alert("Чтобы пользоваться этой функцией, нужно войти в аккаунт.");
        }
    });


    toggleGroupsBtn.addEventListener('click', async () => {
        const isAuth = await window.AppRouter.isAuthorized();
        if (!isAuth) return;

        const isOpen = !navGroupContainer.classList.contains('active');
        navGroupContainer.classList.toggle('active', isOpen);
        if (isOpen) await loadAndRenderGroups();
    });

    addGroupBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        window.GroupCreateModal?.open({ onCreated: () => loadAndRenderGroups().catch(console.error) });
    });
    
    window.addEventListener('auth:changed', updateSidebarUI);
    updateSidebarUI();
})();