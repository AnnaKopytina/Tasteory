function setAuthMode(isLoginMode, elements) {
    const {
        authTitle, nameGroup, authNameInput, profileIdGroup,
        authProfileIdInput, authSubmitBtn, authToggleText, authToggleLink, errorContainer
    } = elements;

    errorContainer.textContent = '';

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

    renderAuthLayout(root);

    const elements = getAuthElements(root);
    if (!elements.authForm) {
        return;
    }

    let isLoginMode = true;
    setAuthMode(isLoginMode, elements);

    elements.authToggleLink.addEventListener('click', (event) => {
        event.preventDefault();
        isLoginMode = !isLoginMode;
        setAuthMode(isLoginMode, elements);
    });

    elements.authForm.addEventListener('submit', async (event) => {
        await handleAuthSubmit(event, isLoginMode, elements);
    });
}

function renderAuthLayout(root) {
    root.innerHTML = `
        <div class="auth-page">
            <div class="auth-illustration" aria-hidden="true"></div>
            <div class="auth-form-section">
                <div class="auth-header">
                    <div class="logo">Tasteory</div>
                </div>
                <h1 class="auth-title" id="auth-title">Вход</h1>
                <div id="auth-error" style="color: #d32f2f; margin-bottom: 15px; font-size: 14px; min-height: 20px;"></div>
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
}

function getAuthElements(root) {
    return {
        authForm: root.querySelector('#auth-form'),
        authTitle: root.querySelector('#auth-title'),
        nameGroup: root.querySelector('#name-group'),
        authNameInput: root.querySelector('#auth-name'),
        profileIdGroup: root.querySelector('#profile-id-group'),
        authProfileIdInput: root.querySelector('#auth-profile-id'),
        authSubmitBtn: root.querySelector('#auth-submit-btn'),
        authToggleText: root.querySelector('#auth-toggle-text'),
        authToggleLink: root.querySelector('#auth-toggle-link'),
        authEmailInput: root.querySelector('#auth-email'),
        authPasswordInput: root.querySelector('#auth-password'),
        errorContainer: root.querySelector('#auth-error')
    };
}

async function handleAuthSubmit(event, isLoginMode, elements) {
    event.preventDefault();
    elements.errorContainer.textContent = '';

    const email = elements.authEmailInput.value.trim();
    const password = elements.authPasswordInput.value;

    const validationError = validateForm(isLoginMode, email, password, elements);
    if (validationError) {
        elements.errorContainer.textContent = validationError;
        return;
    }

    elements.authSubmitBtn.disabled = true;

    try {
        if (isLoginMode) {
            await loginUser(email, password, elements.errorContainer);
        } else {
            await registerUser(email, password, elements);
        }
    } catch (error) {
        elements.errorContainer.textContent = 'Ошибка соединения с сервером.';
    } finally {
        elements.authSubmitBtn.disabled = false;
    }
}

function validateForm(isLoginMode, email, password, elements) {
    if (isLoginMode) {
        return validateLoginData(email, password);
    }
    return validateRegisterData(email, password, elements);
}

function validateLoginData(email, password) {
    if (!email) {
        return 'Email обязателен для заполнения.';
    }
    if (!isValidEmail(email)) {
        return 'Некорректный формат email.';
    }
    if (!password) {
        return 'Пароль обязателен для заполнения.';
    }
    return null;
}

function validateRegisterData(email, password, elements) {
    const displayName = elements.authNameInput.value.trim();
    const username = elements.authProfileIdInput.value.trim().replace(/^@/, '');

    if (!displayName) {
        return 'Имя обязательно для заполнения.';
    }
    if (displayName.length > 100) {
        return 'Имя слишком длинное (максимум 100 символов).';
    }
    if (!username) {
        return 'ID профиля обязателен для заполнения.';
    }
    if (username.length < 3) {
        return 'ID должен содержать минимум 3 символа.';
    }
    if (username.length > 30) {
        return 'ID не должен превышать 30 символов.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return 'ID может содержать только латинские буквы, цифры и подчеркивания.';
    }
    if (!email) {
        return 'Email обязателен для заполнения.';
    }
    if (!isValidEmail(email)) {
        return 'Некорректный формат email.';
    }
    if (email.length > 255) {
        return 'Email не должен превышать 255 символов.';
    }
    if (!password) {
        return 'Пароль обязателен для заполнения.';
    }
    if (password.length < 6) {
        return 'Пароль должен быть не менее 6 символов.';
    }
    if (password.length > 100) {
        return 'Пароль не должен превышать 100 символов.';
    }
    return null;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function loginUser(email, password, errorContainer) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password
        }),
        credentials: 'include'
    });

    if (response.ok) {
        if (window.AppRouter) {
            window.AppRouter.setAuthState(true);
            window.AppRouter.navigate('/main');
        }
    } else {
        errorContainer.textContent = 'Неверная почта или пароль.';
    }
}

async function registerUser(email, password, elements) {
    const displayName = elements.authNameInput.value.trim();
    let username = elements.authProfileIdInput.value.trim();

    if (username.startsWith('@')) {
        username = username.substring(1);
    }

    const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password,
            displayName,
            username
        })
    });

    if (registerResponse.ok) {
        await loginUser(email, password, elements.errorContainer);
    } else {
        elements.errorContainer.textContent = 'Ошибка регистрации. Возможно, пользователь уже существует.';
    }
}