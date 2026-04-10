(() => {
    const groupsList = document.getElementById('groups-list');
    const toggleGroupsBtn = document.getElementById('toggle-groups');
    const navGroupContainer = document.querySelector('.nav-group');

    if (!groupsList || !toggleGroupsBtn || !navGroupContainer) {
        return;
    }

    function setGroupsVisibility(isVisible) {
        navGroupContainer.classList.toggle('active', isVisible);
        groupsList.style.display = isVisible ? 'flex' : 'none';
    }

    function renderGroupItem(group) {
        const item = document.createElement('a');
        item.href = `/group/${group.id}`;
        item.className = 'sub-item';

        const icon = document.createElement('img');
        icon.className = 'icon';
        icon.src = '/svg/sidebar/group.svg';
        icon.alt = '';

        const label = document.createElement('span');
        label.textContent = group.name;

        item.append(icon, label);
        return item;
    }

    async function loadAndRenderGroups() {
        groupsList.innerHTML = '<div class="sub-item">Загрузка групп...</div>';

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
    }

    toggleGroupsBtn.addEventListener('click', async () => {
        const isOpen = !navGroupContainer.classList.contains('active');
        setGroupsVisibility(isOpen);

        if (!isOpen) {
            return;
        }

        try {
            await loadAndRenderGroups();
        } catch (error) {
            console.error('Groups load error:', error);
            groupsList.innerHTML = '<div class="sub-item">Не удалось загрузить группы</div>';
        }
    });

    if (window.location.pathname.startsWith('/group/')) {
        setGroupsVisibility(true);
        loadAndRenderGroups().catch((error) => {
            console.error('Groups load error:', error);
            groupsList.innerHTML = '<div class="sub-item">Не удалось загрузить группы</div>';
        });
    } else {
        setGroupsVisibility(false);
    }
})();
