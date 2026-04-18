import { RecipeCard } from '../../components/recipe-card/RecipeCard.js';

const escapeHtml = window.AppUtils?.escapeHtml || ((value) => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#39;'));

const getInitials = window.AppUtils?.getInitials || ((fullName) => {
	const normalized = String(fullName || '').trim();
	if (!normalized) {
		return '?';
	}

	const parts = normalized.split(/\s+/).filter(Boolean);
	const firstLetter = Array.from(parts[0] || '')[0] || '';
	if (parts.length === 1) {
		return firstLetter.toUpperCase();
	}

	const lastLetter = Array.from(parts[parts.length - 1] || '')[0] || '';
	return `${firstLetter}${lastLetter}`.toUpperCase();
});

const profileState = {
	name: 'Василькова Галина',
	username: '@galka12345',
	recipesCount: 2,
	groupsCount: 0,
	favoritesCount: 12,
	avatarSrc: ''
};

let activeTab = 'recipes';

const tabs = [
	{ id: 'recipes', label: 'Мои рецепты' },
	{ id: 'groups', label: 'Мои группы' },
	{ id: 'favorites', label: 'Избранное' }
];

function renderProfileAvatarMarkup() {
	return profileState.avatarSrc
		? `<img src="${escapeHtml(profileState.avatarSrc)}" alt="">`
		: `<span>${escapeHtml(getInitials(profileState.name))}</span>`;
}

function getProfileRecipes() {
	return [
		{
			id: 'profile-1',
			title: 'Полезный салат со свежими овощами',
			image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=500&auto=format&fit=crop',
			author: profileState.name,
			time: 20,
			savingsCount: 35,
			isFavorite: true
		},
		{
			id: 'profile-2',
			title: 'Паста с томатным соусом',
			image: 'https://img.povar.ru/main-micro/00/00/6c/83/spagetti_chetire_pomidora-825929.jpg',
			author: profileState.name,
			time: 25,
			savingsCount: 12,
			isFavorite: false
		}
	];
}

export function initProfilePage() {
	const root = document.getElementById('content-root');
	if (!root) {
		return;
	}

	renderProfilePage(root);
	bindProfileEvents(root);
	renderActiveProfileTab(root);
}

function renderProfilePage(root) {
	root.innerHTML = `
		<section class="profile-page">
			<div class="profile-hero page-card">
				<div class="profile-hero__left">
					<div class="profile-avatar ${profileState.avatarSrc ? 'profile-avatar--image' : 'profile-avatar--fallback'}" aria-hidden="true">
						${renderProfileAvatarMarkup()}
					</div>
					<div class="profile-meta">
						<h1 class="profile-name">${escapeHtml(profileState.name)}</h1>
						<p class="profile-id">${escapeHtml(profileState.username)}</p>
						<p class="profile-stats">Рецепты: ${profileState.recipesCount} &nbsp;&nbsp; Группы: ${profileState.groupsCount} &nbsp;&nbsp; Избранное: ${profileState.favoritesCount}</p>
					</div>
				</div>
				<button type="button" class="profile-edit-btn" data-action="edit-profile">Редактировать</button>
			</div>

			<div class="profile-tabs search-filters__filters" role="tablist" aria-label="Разделы профиля">
				${tabs.map((tab) => `
					<button
						type="button"
						role="tab"
						class="search-filters__button profile-tab-btn ${activeTab === tab.id ? 'is-active' : ''}"
						aria-selected="${String(activeTab === tab.id)}"
						data-profile-tab="${tab.id}"
					>
						${tab.label}
					</button>
				`).join('')}
			</div>

			<div class="profile-content" data-profile-content></div>
		</section>
	`;
}

function bindProfileEvents(root) {
	if (root.__profileEventsBound) {
		return;
	}

	root.__profileEventsBound = true;

	root.addEventListener('click', (event) => {
		const tabButton = event.target.closest('[data-profile-tab]');
		if (tabButton) {
			const tabId = tabButton.getAttribute('data-profile-tab');
			if (tabId && tabId !== activeTab) {
				activeTab = tabId;
				root.querySelectorAll('[data-profile-tab]').forEach((button) => {
					const isCurrent = button.getAttribute('data-profile-tab') === activeTab;
					button.classList.toggle('is-active', isCurrent);
					button.setAttribute('aria-selected', String(isCurrent));
				});
				renderActiveProfileTab(root);
			}
			return;
		}

		if (event.target.closest('[data-action="edit-profile"]')) {
			openProfileEditModal(root);
			return;
		}

		if (event.target.closest('[data-action="create-group"]')) {
			window.GroupCreateModal?.open({
				onCreated: () => {
					profileState.groupsCount += 1;
					updateProfileHeader(root);
				}
			});
		}
	});
}

function updateProfileHeader(root) {
	const avatar = root.querySelector('.profile-avatar');
	const name = root.querySelector('.profile-name');
	const id = root.querySelector('.profile-id');
	const stats = root.querySelector('.profile-stats');

	if (avatar) {
		avatar.className = `profile-avatar ${profileState.avatarSrc ? 'profile-avatar--image' : 'profile-avatar--fallback'}`;
		avatar.innerHTML = renderProfileAvatarMarkup();
	}

	if (name) {
		name.textContent = profileState.name;
	}

	if (id) {
		id.textContent = profileState.username;
	}

	if (stats) {
		stats.innerHTML = `Рецепты: ${profileState.recipesCount} &nbsp;&nbsp; Группы: ${profileState.groupsCount} &nbsp;&nbsp; Избранное: ${profileState.favoritesCount}`;
	}
}

function renderActiveProfileTab(root) {
	const content = root.querySelector('[data-profile-content]');
	if (!content) {
		return;
	}

	if (activeTab === 'groups') {
		content.innerHTML = `
			<div class="profile-groups-actions">
				<button type="button" class="profile-create-group-btn" data-action="create-group">Создать группу</button>
			</div>
			<div class="profile-empty profile-empty--compact">Группы скоро появятся</div>
		`;
		return;
	}

	const data = activeTab === 'favorites'
		? getProfileRecipes().filter((recipe) => recipe.isFavorite)
		: getProfileRecipes();

	if (!data.length) {
		content.innerHTML = '<div class="profile-empty">Пока здесь пусто</div>';
		return;
	}

	content.innerHTML = '<div class="profile-cards-grid"></div>';
	const grid = content.querySelector('.profile-cards-grid');
	RecipeCard.renderRecipeCards(data, grid, {
		onFavoriteClick: () => {
			renderActiveProfileTab(root);
		}
	});
}

function openProfileEditModal(root) {
	const contentRoot = document.getElementById('content-root');
	if (!contentRoot) {
		return;
	}

	const existing = contentRoot.querySelector('.profile-edit-backdrop');
	if (existing) {
		existing.remove();
	}

	let draftName = profileState.name;
	let draftAvatarSrc = profileState.avatarSrc;

	const backdrop = document.createElement('div');
	backdrop.className = 'profile-edit-backdrop';
	backdrop.innerHTML = `
		<div class="profile-edit-modal" role="dialog" aria-modal="true" aria-label="Редактировать профиль">
			<div class="profile-edit-modal__header">
				<h2 class="profile-edit-modal__title">Редактировать профиль</h2>
				<button type="button" class="profile-edit-modal__close" aria-label="Закрыть">×</button>
			</div>

			<form class="profile-edit-modal__form">
				<div class="profile-edit-modal__avatar-section">
					<div class="profile-edit-modal__avatar" data-avatar-preview></div>
					<div class="profile-edit-modal__avatar-btns">
						<button type="button" class="profile-edit-modal__btn-primary" data-upload-avatar>Загрузить фото</button>
						<button type="button" class="profile-edit-modal__btn-ghost" data-clear-avatar>Убрать фото</button>
					</div>
				</div>

				<input type="file" accept="image/*" hidden data-avatar-input>

				<label class="profile-edit-modal__label">Имя профиля</label>
				<input class="profile-edit-modal__input" type="text" data-name-input placeholder="Введите имя" maxlength="80" required />

				<p class="profile-edit-modal__status" data-status></p>

				<div class="profile-edit-modal__buttons">
					<button type="submit" class="profile-edit-modal__btn-primary">Сохранить</button>
					<button type="button" class="profile-edit-modal__btn-ghost" data-cancel>Отмена</button>
				</div>
			</form>
		</div>
	`;

	contentRoot.appendChild(backdrop);

	const form = backdrop.querySelector('.profile-edit-modal__form');
	const closeBtn = backdrop.querySelector('.profile-edit-modal__close');
	const nameInput = backdrop.querySelector('[data-name-input]');
	const avatarInput = backdrop.querySelector('[data-avatar-input]');
	const avatarPreview = backdrop.querySelector('[data-avatar-preview]');
	const status = backdrop.querySelector('[data-status]');

	if (!form || !nameInput || !avatarInput || !avatarPreview || !status) {
		backdrop.remove();
		return;
	}

	function closeModal() {
		backdrop.remove();
	}

	function updateAvatarPreview() {
		if (!avatarPreview) return;

		if (draftAvatarSrc) {
			avatarPreview.classList.add('profile-edit-modal__avatar--image');
			avatarPreview.style.backgroundImage = `url(${draftAvatarSrc})`;
			avatarPreview.style.backgroundSize = 'cover';
			avatarPreview.style.backgroundPosition = 'center';
			avatarPreview.innerHTML = '';
		} else {
			avatarPreview.classList.remove('profile-edit-modal__avatar--image');
			avatarPreview.style.backgroundImage = '';
			avatarPreview.style.backgroundSize = '';
			avatarPreview.style.backgroundPosition = '';
			avatarPreview.innerHTML = `<span>${escapeHtml(getInitials(draftName || profileState.name))}</span>`;
		}
	}

	function showStatus(msg, isError = false) {
		if (status) {
			status.textContent = msg;
			status.style.color = isError ? '#bf3f3f' : '#7b8795';
		}
	}

	// Инициализация
	nameInput.value = profileState.name;
	updateAvatarPreview();

	// События
	closeBtn?.addEventListener('click', closeModal);
	backdrop.querySelector('[data-cancel]')?.addEventListener('click', closeModal);
	backdrop.querySelector('[data-upload-avatar]')?.addEventListener('click', (e) => {
		e.preventDefault();
		avatarInput?.click();
	});
	backdrop.querySelector('[data-clear-avatar]')?.addEventListener('click', (e) => {
		e.preventDefault();
		draftAvatarSrc = '';
		updateAvatarPreview();
	});

	avatarInput?.addEventListener('change', () => {
		const file = avatarInput.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			draftAvatarSrc = e.target?.result || '';
			updateAvatarPreview();
		};
		reader.readAsDataURL(file);
	});

	nameInput?.addEventListener('input', () => {
		draftName = nameInput.value;
		updateAvatarPreview();
	});

	form?.addEventListener('submit', (e) => {
		e.preventDefault();

		const nextName = nameInput.value.trim();
		if (!nextName) {
			showStatus('Введите имя профиля', true);
			return;
		}

		profileState.name = nextName;
		profileState.avatarSrc = draftAvatarSrc;

		updateProfileHeader(root);
		if (activeTab !== 'groups') {
			renderActiveProfileTab(root);
		}
		closeModal();
	});

	backdrop.addEventListener('click', (e) => {
		if (e.target === backdrop) {
			closeModal();
		}
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && backdrop.parentNode) {
			closeModal();
		}
	}, { once: true });

	nameInput?.focus();
}

