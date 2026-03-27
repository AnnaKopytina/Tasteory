const ApiService = {
    baseUrl: '/api',

    async getMyGroups() {
        try {
            const response = await fetch(`${this.baseUrl}/users/me/groups`);
            if (!response.ok) {
                throw new Error('Ошибка при получении групп');
            }
            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    },

    async addGroup(groupName) {
        console.log(`Тут будет POST запрос на сервер для группы: ${groupName}`);
    }
};