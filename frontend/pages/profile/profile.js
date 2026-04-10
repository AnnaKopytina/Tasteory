export function initProfilePage() {
	const root = document.getElementById('content-root');
	root.innerHTML = `
		<section class="page-card profile-page">
			<h1>Профиль</h1>
			<p class="page-description">Базовый шаблон страницы профиля для дальнейшего расширения.</p>
		</section>
	`;
}