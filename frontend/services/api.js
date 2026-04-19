(function () {
    const ApiService = {
        baseUrl: '/api'
    };

    const mockGroups = [
        {id: '1', name: 'Семья'},
        {id: '2', name: 'Поварёшки'}
    ];

    function appendMockGroup(group) {
        if (!group || !group.id || !group.name) {
            return;
        }
        const alreadyExists = mockGroups.some((item) => String(item.id) === String(group.id));
        if (!alreadyExists) {
            mockGroups.unshift({id: String(group.id), name: String(group.name)});
        }
    }

    async function request(path, options = {}) {
        const response = await fetch(`${ApiService.baseUrl}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            credentials: 'include',
            ...options
        });

        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
            ? await response.json().catch(() => null)
            : await response.text().catch(() => '');

        if (!response.ok) {
            const message = payload && typeof payload === 'object' && payload.error
                ? payload.error
                : `HTTP ${response.status}`;
            throw new Error(message);
        }

        return payload;
    }

    ApiService.request = request;

    ApiService.getMyGroups = async function (page = 1, pageSize = 20) {
        try {
            const result = await request(`/users/me/groups?page=${page}&pageSize=${pageSize}`);
            return {
                items: Array.isArray(result.items) ? result.items : mockGroups,
                totalCount: result.totalCount || 0,
                page: result.page || page,
                pageSize: result.pageSize || pageSize
            };
        } catch (error) {
            console.error('API Error:', error);
            return { items: mockGroups, totalCount: 0, page, pageSize };
        }
    };

    ApiService.addGroup = async function (groupName) {
        return request('/groups', {
            method: 'POST',
            body: JSON.stringify({name: groupName})
        });
    };

    window.ApiService = ApiService;
})();