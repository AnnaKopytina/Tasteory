import {AuthService} from "../../services/auth-service.js";
import {el} from "../../core/dom.js";

export function initAuthPage() {
    const root = document.getElementById('content-root');
    if (!root) {
        return;
    }

    root.textContent = '';

    const elements = renderAuthLayout(root);

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
    const authTitle = el('h1', {class: 'auth-title', id: 'auth-title'}, 'Вход');
    const errorContainer = el('div', {id: 'auth-error', class: 'auth-error-message'});

    const authNameInput = el('input', {type: 'text', id: 'auth-name', placeholder: 'Введите имя и фамилию'});
    const nameGroup = el('div', {class: 'input-group hidden', id: 'name-group'},
        el('label', {for: 'auth-name'}, 'Имя пользователя'),
        authNameInput
    );

    const authProfileIdInput = el('input', {type: 'text', id: 'auth-profile-id', placeholder: 'Например, user_123'});
    const profileIdGroup = el('div', {class: 'input-group hidden', id: 'profile-id-group'},
        el('label', {for: 'auth-profile-id'}, 'Уникальный ID профиля'),
        authProfileIdInput
    );

    const authEmailInput = el('input', {type: 'email', id: 'auth-email', placeholder: 'Введите почту', required: true});
    const emailGroup = el('div', {class: 'input-group'},
        el('label', {for: 'auth-email'}, 'Почта'),
        authEmailInput
    );

    const authPasswordInput = el('input', {
        type: 'password',
        id: 'auth-password',
        placeholder: 'Введите пароль',
        required: true
    });
    const passwordGroup = el('div', {class: 'input-group'},
        el('label', {for: 'auth-password'}, 'Пароль'),
        el('div', {class: 'password-wrapper'}, authPasswordInput)
    );

    const authSubmitBtn = el('button', {type: 'submit', class: 'auth-submit-btn', id: 'auth-submit-btn'}, 'Войти');

    const authForm = el('form', {id: 'auth-form'},
        nameGroup, profileIdGroup, emailGroup, passwordGroup, authSubmitBtn
    );

    const authToggleText = el('span', {id: 'auth-toggle-text'}, 'Ещё нет аккаунта?');
    const authToggleLink = el('a', {href: '#', id: 'auth-toggle-link'}, 'Зарегистрироваться');

    const authPage = el('div', {class: 'auth-page'},
        el('div', {class: 'auth-illustration', 'aria-hidden': 'true'},
            el('img', {src: '../../svg/auth/installation.svg', alt: 'Some food.'})
        ),
        el('div', {class: 'auth-form-section'},
            el('div', {class: 'auth-header'},
                el('div', {class: 'logo'}, 'Tasteory')
            ),
            authTitle,
            errorContainer,
            authForm,
            el('div', {class: 'auth-footer'}, authToggleText, ' ', authToggleLink)
        )
    );

    root.append(authPage);

    return {
        authForm, authTitle, nameGroup, authNameInput,
        profileIdGroup, authProfileIdInput, authSubmitBtn,
        authToggleText, authToggleLink, authEmailInput,
        authPasswordInput, errorContainer
    };
}

function setAuthMode(isLoginMode, elements) {
    elements.errorContainer.textContent = '';

    if (isLoginMode) {
        elements.authTitle.textContent = 'Вход';
        elements.nameGroup.classList.add('hidden');
        elements.authNameInput.removeAttribute('required');
        elements.profileIdGroup.classList.add('hidden');
        elements.authProfileIdInput.removeAttribute('required');
        elements.authSubmitBtn.textContent = 'Войти';
        elements.authToggleText.textContent = 'Ещё нет аккаунта?';
        elements.authToggleLink.textContent = 'Зарегистрироваться';
        return;
    }

    elements.authTitle.textContent = 'Создать аккаунт';
    elements.nameGroup.classList.remove('hidden');
    elements.authNameInput.setAttribute('required', 'true');
    elements.profileIdGroup.classList.remove('hidden');
    elements.authProfileIdInput.setAttribute('required', 'true');
    elements.authSubmitBtn.textContent = 'Зарегистрироваться';
    elements.authToggleText.textContent = 'Уже есть аккаунт?';
    elements.authToggleLink.textContent = 'Войти';
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
    try {
        await AuthService.login(email, password);

        if (window.AppRouter) {
            window.AppRouter.setAuthState(true);
            const backTo = window.AppRouter.consumeIntendedUrl();
            window.AppRouter.navigate(backTo || '/main');
        }
    } catch (error) {
        errorContainer.textContent = error.message || 'Неверная почта или пароль.';
    }
}

async function registerUser(email, password, elements) {
    const displayName = elements.authNameInput.value.trim();
    let username = elements.authProfileIdInput.value.trim();

    if (username.startsWith('@')) {
        username = username.substring(1);
    }

    try {
        await AuthService.register(displayName, username, email, password);
        await loginUser(email, password, elements.errorContainer);
    } catch (error) {
        elements.errorContainer.textContent = error.message || 'Ошибка регистрации. Возможно, пользователь уже существует.';
    }
}