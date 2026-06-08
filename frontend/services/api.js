export class ApiService {
    static async request(url, options = {}) {
        const defaultOptions = {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const combinedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        if (combinedOptions.body && typeof combinedOptions.body === "object" && !(combinedOptions.body instanceof FormData)) {
            combinedOptions.body = JSON.stringify(combinedOptions.body);
        }

        const response = await fetch(url, combinedOptions);

        if (response.status === 401) {
            if (window.AppRouter) {
                window.AppRouter.setAuthState(false);
            }

            throw new Error('UNAUTHORIZED');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : {};
    }

    static get(url, options = {}) {
        return this.request(url, { ...options, method: "GET" });
    }

    static post(url, body = null, options = {}) {
        const fetchOptions = { ...options, method: "POST" };
        if (body) {
            fetchOptions.body = body;
        }
        return this.request(url, fetchOptions);
    }

    static put(url, body = null, options = {}) {
        const fetchOptions = { ...options, method: "PUT" };
        if (body) {
            fetchOptions.body = body;
        }
        return this.request(url, fetchOptions);
    }

    static delete(url, options = {}) {
        return this.request(url, { ...options, method: "DELETE" });
    }
}