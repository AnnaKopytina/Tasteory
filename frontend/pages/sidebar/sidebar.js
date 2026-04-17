(() => {
    const renderIcon = window.AppIcons?.renderIcon;

    function createIcon(iconName, className = '') {
        if (!renderIcon) {
            return null;
        }

        const html = window.AppIcons.renderIcon(iconName, className);
        if (!html) {
            return null;
        }

        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    }

    function replaceSidebarIconsWithSvg() {
        document.querySelectorAll('.sidebar [data-icon]').forEach((element) => {
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

    function renderGroupsError() {
        groupsList.innerHTML = '<div class="sub-item">Не удалось загрузить группы</div>';
    }

    function renderGroupItem(group) {
        const item = document.createElement('a');
        item.href = `/group/${group.id}`;
        item.className = 'sub-item';

        const icon = createIcon('group');
        if (icon) {
            icon.classList.add('icon');
        }

        const label = document.createElement('span');
        label.textContent = group.name;

        if (icon) {
            item.append(icon, label);
        } else {
            item.append(label);
        }
        return item;
    }

    async function loadAndRenderGroups() {
        groupsList.innerHTML = '<div class="sub-item">Загрузка групп...</div>';

        try {
            const groupsData = await ApiService.getMyGroups();
            groupsList.innerHTML = '';

            if (!groupsData.length) {
                const emptyState = document.createElement('div');
                emptyState.className = 'sub-item';
                emptyState.textContent = 'Пока групп нет';
                groupsList.appendChild(emptyState);
                return;
            }

            groupsData.forEach((group) => {
                groupsList.appendChild(renderGroupItem(group));
            });
        } catch (error) {
            console.error('Groups load error:', error);
            renderGroupsError();
        }
    }

    toggleGroupsBtn.addEventListener('click', async () => {
        const isOpen = !navGroupContainer.classList.contains('active');
        setGroupsVisibility(isOpen);

        if (!isOpen) {
            return;
        }

        await loadAndRenderGroups();
    });

    addGroupBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (window.GroupCreateModal?.open) {
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