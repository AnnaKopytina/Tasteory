document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const nameGroup = document.getElementById('name-group');
    const authNameInput = document.getElementById('auth-name');
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
            authSubmitBtn.textContent = 'Войти';
            authToggleText.textContent = 'Ещё нет аккаунта?';
            authToggleLink.textContent = 'Зарегистрироваться';
        } else {
            authTitle.textContent = 'Создать аккаунт';
            nameGroup.style.display = 'block';
            authNameInput.setAttribute('required', 'true');
            authSubmitBtn.textContent = 'Зарегистрироваться';
            authToggleText.textContent = 'Уже есть аккаунт?';
            authToggleLink.textContent = 'Войти';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        try {
            const fakeToken = btoa(email + password);
            localStorage.setItem('tasteory_token', fakeToken);

            window.location.href = '/index.html';
        } catch (error) {
            console.error('Ошибка:', error);
        }
    });
});