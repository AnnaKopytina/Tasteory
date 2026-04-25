(() => {
    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function filenameFromPath(path) {
        if (!path) {
            return '';
        }

        return String(path).split('/').pop() || '';
    }

    function getInitials(fullName) {
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
    }

    function renderRestrictedContent(root) {
        root.innerHTML = `
        <div class="restricted-container" style="
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 60vh; 
            text-align: center;
            font-family: 'Montserrat', sans-serif;
        ">
            <h2 style="color: #0a2533; margin-bottom: 20px;">Войдите или зарегистрируйтесь, <br> чтобы пользоваться этой страницей</h2>
            <button id="restricted-login-btn" style="
                background-color: #f28c50; 
                color: white; 
                border: none; 
                padding: 12px 30px; 
                border-radius: 15px; 
                font-size: 18px; 
                font-weight: bold; 
                cursor: pointer;
                transition: transform 0.2s;
            ">Войти</button>
        </div>
    `;

        document.getElementById('restricted-login-btn').onclick = () => {
            window.AppRouter.navigate('/auth');
        };
    }

    window.AppUtils = {
        escapeHtml,
        clamp,
        filenameFromPath,
        getInitials,
        renderRestrictedContent
    };
})();

