(function () {
    const ApiService = {
        baseUrl: '/api'
    };

    const mockGroups = [
        { id: '1', name: 'Семья' },
        { id: '2', name: 'Поварёшки' }
    ];

    function appendMockGroup(group) {
        if (!group || !group.id || !group.name) {
            return;
        }

        const alreadyExists = mockGroups.some((item) => String(item.id) === String(group.id));
        if (!alreadyExists) {
            mockGroups.unshift({ id: String(group.id), name: String(group.name) });
        }
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
            return Array.isArray(result) && result.length ? result : mockGroups;
        } catch (error) {
            console.error('API Error:', error);
            return mockGroups;
        }
    };

    ApiService.addGroup = async function (groupName) {
        return request('/groups', {
            method: 'POST',
            body: JSON.stringify({ name: groupName })
        });
    };

    window.ApiService = ApiService;
})();


