import { ApiService } from "./api.js";

export class RecipeService {
    static async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        return ApiService.get(`/api/recipes?${query}`);
    }

    static async getById(id, groupId = null) {
        let url = `/api/recipes/${id}`;
        if (groupId) url += `?groupId=${groupId}`;
        return ApiService.get(url);
    }

    static async toggleFavorite(id, isAdding) {
        const method = isAdding ? "POST" : "DELETE";
        return ApiService.request(`/api/favorites/${id}`, { method });
    }

    static async create(recipeData) {
        return ApiService.post("/api/recipes", recipeData);
    }

    static async update(id, recipeData) {
        return ApiService.put(`/api/recipes/${id}`, recipeData);
    }

    static async delete(id) {
        return ApiService.delete(`/api/recipes/${id}`);
    }

    static async getUserRecipes(userId, page = 1, pageSize = 50) {
        return ApiService.get(`/api/recipes/user/${userId}?page=${page}&pageSize=${pageSize}`);
    }

    static async getFavorites(page = 1, pageSize = 50) {
        return ApiService.get(`/api/users/me/favorites?page=${page}&pageSize=${pageSize}`);
    }
}