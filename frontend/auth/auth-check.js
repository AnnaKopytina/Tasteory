document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/users/me', { credentials: 'include' });
        if (!response.ok) {
            window.location.href = '/auth.html';
            return;
        }
    } catch (error) {
        window.location.href = '/auth.html';
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/auth.html';
        });
    }
});