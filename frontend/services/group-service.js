import { ApiService } from "./api.js";

export class GroupService {
    static async create(name) {
        return ApiService.post('/api/groups', { name });
    }

    static async getMyGroups(page = 1, pageSize = 50) {
        return ApiService.get(`/api/users/me/groups?page=${page}&pageSize=${pageSize}`);
    }

    static async getById(groupId) {
        return ApiService.get(`/api/groups/${groupId}`);
    }

    static async getMembers(groupId) {
        return ApiService.get(`/api/groups/${groupId}/members`);
    }

    static async getRecipes(groupId, queryStr) {
        return ApiService.get(`/api/groups/${groupId}/recipes?${queryStr}`);
    }

    static async addRecipe(groupId, recipeId) {
        return ApiService.post(`/api/groups/${groupId}/recipes`, JSON.stringify(recipeId));
    }

    static async addRecipes(groupId, recipeIds) {
        const promises = recipeIds.map(id => this.addRecipe(groupId, id));
        return Promise.all(promises);
    }

    static async generateInvite(groupId) {
        return ApiService.post(`/api/groups/${groupId}/invite`);
    }

    static async join(inviteCode) {
        return ApiService.post('/api/groups/join', { inviteCode });
    }

    static async update(groupId, data) {
        return ApiService.put(`/api/groups/${groupId}`, data);
    }

    static async delete(groupId) {
        return ApiService.delete(`/api/groups/${groupId}`);
    }

    static async addMemberByUsername(groupId, userName) {
        return ApiService.post(`/api/groups/${groupId}/members/by-username`, { userName });
    }

    static async kickMember(groupId, memberId) {
        return ApiService.delete(`/api/groups/${groupId}/members/${memberId}`);
    }

    static async leave(groupId) {
        return ApiService.delete(`/api/groups/${groupId}/members/me`);
    }
}