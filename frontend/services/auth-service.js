import {ApiService} from "./api.js";

export class AuthService {
    static async getStatus() {
        try {
            await ApiService.get('/api/auth/status');
            return true;
        } catch (e) {
            return false;
        }
    }

    static async login(email, password) {
        return ApiService.post('/api/auth/login', { email, password });
    }

    static async register(displayName, username, email, password) {
        return ApiService.post('/api/auth/register', { displayName, username, email, password });
    }

    static async logout() {
        return ApiService.post('/api/auth/logout');
    }

    static async getCurrentUser() {
        return ApiService.get('/api/users/me');
    }
}