document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const nameGroup = document.getElementById('name-group');
    const authNameInput = document.getElementById('auth-name');
    const profileIdGroup = document.getElementById('profile-id-group');
    const authProfileIdInput = document.getElementById('auth-profile-id');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const authToggleLink = document.getElementById('auth-toggle-link');

    let isLoginMode = true;

    authToggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            authTitle.textContent = 'Вход';
            nameGroup.style.display = 'none';
            authNameInput.removeAttribute('required');
            profileIdGroup.style.display = 'none';
            authProfileIdInput.removeAttribute('required');
            authSubmitBtn.textContent = 'Войти';
            authToggleText.textContent = 'Ещё нет аккаунта?';
            authToggleLink.textContent = 'Зарегистрироваться';
        } else {
            authTitle.textContent = 'Создать аккаунт';
            nameGroup.style.display = 'block';
            authNameInput.setAttribute('required', 'true');
            profileIdGroup.style.display = 'block';
            authProfileIdInput.setAttribute('required', 'true');
            authSubmitBtn.textContent = 'Зарегистрироваться';
            authToggleText.textContent = 'Уже есть аккаунт?';
            authToggleLink.textContent = 'Войти';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const displayName = authNameInput.value.trim();
        const username = authProfileIdInput.value.trim();

        try {
            if (!isLoginMode) {
                const registerResponse = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ displayName, username, email, password }),
                    credentials: 'include'
                });

                if (!registerResponse.ok) {
                    const errorData = await registerResponse.json().catch(() => ({}));
                    if (errorData.error) {
                        throw new Error(errorData.error);
                    }
                    if (errorData.errors) {
                        const messages = Object.values(errorData.errors).flat();
                        throw new Error(messages[0] || "Ошибка валидации");
                    }
                    throw new Error(`HTTP ${registerResponse.status}`);
                }
            }

            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!loginResponse.ok) {
                const errorData = await loginResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${loginResponse.status}`);
            }

            window.location.href = '/main';
        } catch (error) {
            console.error('Auth error:', error);
            alert(error.message);
        }
    });
});