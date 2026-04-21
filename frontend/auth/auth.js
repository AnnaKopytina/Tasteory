function setAuthMode(isLoginMode, elements) {
    const {
        authTitle,
        nameGroup,
        authNameInput,
        profileIdGroup,
        authProfileIdInput,
        authSubmitBtn,
        authToggleText,
        authToggleLink
    } = elements;

    if (isLoginMode) {
        authTitle.textContent = 'Вход';
        nameGroup.style.display = 'none';
        authNameInput.removeAttribute('required');
        profileIdGroup.style.display = 'none';
        authProfileIdInput.removeAttribute('required');
        authSubmitBtn.textContent = 'Войти';
        authToggleText.textContent = 'Ещё нет аккаунта?';
        authToggleLink.textContent = 'Зарегистрироваться';
        return;
    }

    authTitle.textContent = 'Создать аккаунт';
    nameGroup.style.display = 'block';
    authNameInput.setAttribute('required', 'true');
    profileIdGroup.style.display = 'block';
    authProfileIdInput.setAttribute('required', 'true');
    authSubmitBtn.textContent = 'Зарегистрироваться';
    authToggleText.textContent = 'Уже есть аккаунт?';
    authToggleLink.textContent = 'Войти';
}

export function initAuthPage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.innerHTML = `
        <div class="auth-page">
            <div class="auth-illustration" aria-hidden="true"></div>
            <div class="auth-form-section">
                <div class="auth-header">
                    <div class="logo">Tasteory</div>
                </div>
                <h1 class="auth-title" id="auth-title">Вход</h1>
                <form id="auth-form">
                    <div class="input-group" id="name-group" style="display: none;">
                        <label for="auth-name">Имя пользователя</label>
                        <input type="text" id="auth-name" placeholder="Введите имя и фамилию">
                    </div>
                    <div class="input-group" id="profile-id-group" style="display: none;">
                        <label for="auth-profile-id">Уникальный ID профиля</label>
                        <input type="text" id="auth-profile-id" placeholder="Например, user_123">
                    </div>
                    <div class="input-group">
                        <label for="auth-email">Почта</label>
                        <input type="email" id="auth-email" placeholder="Введите почту" required>
                    </div>
                    <div class="input-group">
                        <label for="auth-password">Пароль</label>
                        <div class="password-wrapper">
                            <input type="password" id="auth-password" placeholder="Введите пароль" required>
                        </div>
                    </div>
                    <button type="submit" class="auth-submit-btn" id="auth-submit-btn">Войти</button>
                </form>
                <div class="auth-footer">
                    <span id="auth-toggle-text">Ещё нет аккаунта?</span>
                    <a href="#" id="auth-toggle-link">Зарегистрироваться</a>
                </div>
            </div>
        </div>
    `;

    const authForm = root.querySelector('.auth-form');
    const authTitle = root.querySelector('.auth-title');
    const nameGroup = root.querySelector('.name-group');
    const authNameInput = root.querySelector('.auth-name');
    const profileIdGroup = root.querySelector('.profile-id-group');
    const authProfileIdInput = root.querySelector('.auth-profile-id');
    const authSubmitBtn = root.querySelector('.auth-submit-btn');
    const authToggleText = root.querySelector('.auth-toggle-text');
    const authToggleLink = root.querySelector('.auth-toggle-link');
    const authEmailInput = root.querySelector('.auth-email');
    const authPasswordInput = root.querySelector('.auth-password');

    if (!authForm || !authTitle || !nameGroup || !authNameInput || !profileIdGroup || !authProfileIdInput || !authSubmitBtn || !authToggleText || !authToggleLink || !authEmailInput || !authPasswordInput) {
        return;
    }

    let isLoginMode = true;
    const modeElements = { authTitle, nameGroup, authNameInput, profileIdGroup, authProfileIdInput, authSubmitBtn, authToggleText, authToggleLink };
    setAuthMode(isLoginMode, modeElements);

    authToggleLink.addEventListener('click', (event) => {
        event.preventDefault();
        isLoginMode = !isLoginMode;
        setAuthMode(isLoginMode, modeElements);
    });

    authForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const profileId = authProfileIdInput.value.trim();

        const fakeToken = btoa(email + password);
        localStorage.setItem('tasteory_token', fakeToken);

        if (!isLoginMode) {
            localStorage.setItem('tasteory_auth_profile_id', profileId.startsWith('@') ? profileId : `@${profileId}`);
        }

        window.AppRouter?.navigate('/main');
    });
}