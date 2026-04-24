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
        document.querySelectorAll('.sidebar [data-icon]').forEach((element) => {
            processIconElement(element);
        });
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
                renderEmptyGroupsState();
                return;
            }

            renderGroupsList(groupsData);
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

    toggleGroupsBtn.addEventListener('click', async () => {
        const isOpen = !navGroupContainer.classList.contains('active');
        setGroupsVisibility(isOpen);
        if (isOpen) {
            await loadAndRenderGroups();
        }
    });

    addGroupBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (window.GroupCreateModal && window.GroupCreateModal.open) {
            window.GroupCreateModal.open({
                onCreated: () => {
                    loadAndRenderGroups().catch(console.error);
                }
            });
        }
    });

    window.addEventListener('groups:changed', () => {
        if (navGroupContainer.classList.contains('active')) {
            loadAndRenderGroups().catch(console.error);
        }
    });

    setGroupsVisibility(false);
})();