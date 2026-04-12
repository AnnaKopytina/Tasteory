(() => {
    const ICONS = {
        book: {
            viewBox: '0 0 27 24',
            path: 'M13.0833 5.83333C13.0833 4.55145 12.5741 3.32208 11.6677 2.41565C10.7613 1.50922 9.53188 1 8.25 1H1V19.125H9.45833C10.4197 19.125 11.3418 19.5069 12.0216 20.1867C12.7014 20.8666 13.0833 21.7886 13.0833 22.75M13.0833 5.83333V22.75M13.0833 5.83333C13.0833 4.55145 13.5926 3.32208 14.499 2.41565C15.4054 1.50922 16.6348 1 17.9167 1H25.1667V19.125H16.7083C15.7469 19.125 14.8249 19.5069 14.1451 20.1867C13.4653 20.8666 13.0833 21.7886 13.0833 22.75'
        },
        plus: {
            viewBox: '0 0 20 20',
            path: 'M9.75 1V18.5M1 9.75H18.5'
        },
        openIcon: {
            viewBox: '0 0 10 17',
            path: 'M1 15.5L8.25 8.25L1 1'
        },
        fovorite: {
            viewBox: '0 0 19 24',
            path: 'M17.9167 22.75L9.45833 16.7083L1 22.75V3.41667C1 2.77573 1.25461 2.16104 1.70783 1.70783C2.16104 1.25461 2.77573 1 3.41667 1H15.5C16.1409 1 16.7556 1.25461 17.2088 1.70783C17.6621 2.16104 17.9167 2.77573 17.9167 3.41667V22.75Z'
        },
        profile: {
            viewBox: '0 0 22 24',
            path: 'M20.3333 22.75V20.3333C20.3333 19.0515 19.8241 17.8221 18.9177 16.9157C18.0113 16.0092 16.7819 15.5 15.5 15.5H5.83333C4.55145 15.5 3.32208 16.0092 2.41565 16.9157C1.50922 17.8221 1 19.0515 1 20.3333V22.75M15.5 5.83333C15.5 8.50271 13.336 10.6667 10.6667 10.6667C7.99729 10.6667 5.83333 8.50271 5.83333 5.83333C5.83333 3.16396 7.99729 1 10.6667 1C13.336 1 15.5 3.16396 15.5 5.83333Z'
        },
        group: {
            viewBox: '0 0 29 24',
            path: 'M20.3333 22.75V20.3333C20.3333 19.0515 19.8241 17.8221 18.9177 16.9157C18.0113 16.0092 16.7819 15.5 15.5 15.5H5.83333C4.55145 15.5 3.32208 16.0092 2.41565 16.9157C1.50922 17.8221 1 19.0515 1 20.3333V22.75M27.5833 22.75V20.3333C27.5825 19.2624 27.2261 18.2221 26.57 17.3757C25.9139 16.5293 24.9952 15.9248 23.9583 15.6571M19.125 1.15708C20.1647 1.42328 21.0862 2.02793 21.7442 2.87571C22.4023 3.72349 22.7595 4.76617 22.7595 5.83938C22.7595 6.91258 22.4023 7.95526 21.7442 8.80304C21.0862 9.65082 20.1647 10.2555 19.125 10.5217M15.5 5.83333C15.5 8.50271 13.336 10.6667 10.6667 10.6667C7.99729 10.6667 5.83333 8.50271 5.83333 5.83333C5.83333 3.16396 7.99729 1 10.6667 1C13.336 1 15.5 3.16396 15.5 5.83333Z'
        }
    };

    function createIcon(iconName) {
        const iconData = ICONS[iconName];
        if (!iconData) {
            return null;
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', iconData.viewBox);
        svg.setAttribute('fill', 'none');
        svg.setAttribute('aria-hidden', 'true');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', iconData.path);
        path.setAttribute('stroke', '#0A2533');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');

        svg.appendChild(path);
        return svg;
    }

    function resolveIconName(src) {
        if (!src) {
            return null;
        }

        const fileName = src.split('/').pop();
        return fileName ? fileName.replace('.svg', '') : null;
    }

    function replaceSidebarImagesWithSvg() {
        document.querySelectorAll('.sidebar img.icon').forEach((img) => {
            const iconName = resolveIconName(img.getAttribute('src'));
            const svg = createIcon(iconName);
            if (!svg) {
                return;
            }

            svg.classList.add(...img.classList);

            if (img.id) {
                svg.id = img.id;
            }

            if (img.title) {
                svg.setAttribute('title', img.title);
            }

            img.replaceWith(svg);
        });
    }

    replaceSidebarImagesWithSvg();

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
