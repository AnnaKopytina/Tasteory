(function () {
    const ApiService = {
        baseUrl: '/api'
    };

    function getDataStore() {
        return window.TasteoryDataStore || null;
    }

    function getFallbackGroups() {
        const dataStore = getDataStore();
        if (typeof dataStore?.getMyGroups === 'function') {
            return dataStore.getMyGroups();
        }

        return [];
    }

    function upsertMockGroup(group) {
        if (!group || !group.name) {
            return;
        }

        const dataStore = getDataStore();
        const storeGroup = typeof dataStore?.createGroup === 'function'
            ? dataStore.createGroup(group.name, group.memberIds || [])
            : null;

        if (storeGroup && group.id) {
            storeGroup.id = String(group.id);
        }

        if (storeGroup && group.name) {
            storeGroup.name = String(group.name);
        }

        return storeGroup || group;
    }

    async function request(path, options = {}) {
        const response = await fetch(`${ApiService.baseUrl}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
            ? await response.json().catch(() => null)
            : await response.text().catch(() => '');

        if (!response.ok) {
            const message = payload && typeof payload === 'object' && payload.message
                ? payload.message
                : `HTTP ${response.status}`;
            throw new Error(message);
        }

        return payload;
    }

    ApiService.request = request;

    ApiService.getMyGroups = async function () {
        try {
            const result = await request('/users/me/groups');
            return Array.isArray(result) && result.length ? result : getFallbackGroups();
        } catch (error) {
            console.error('API Error:', error);
            return getFallbackGroups();
        }
    };

    ApiService.addGroup = async function (groupName, memberIds = []) {
        try {
            const createdGroup = await request('/groups', {
                method: 'POST',
                body: JSON.stringify({ name: groupName, memberIds })
            });

            return upsertMockGroup(createdGroup || { name: groupName, memberIds });
        } catch (error) {
            return upsertMockGroup({ name: groupName, memberIds }) || {
                id: `group-${Date.now()}`,
                name: String(groupName || 'Новая группа')
            };
        }
    };

    ApiService.removeMockGroup = function (groupId) {
        const dataStore = getDataStore();
        if (typeof dataStore?.removeGroupById === 'function') {
            return dataStore.removeGroupById(groupId);
        }

        return false;
    };

    window.ApiService = ApiService;
})();


