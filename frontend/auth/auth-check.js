if (!localStorage.getItem('tasteory_token')) {
    window.location.href = '/auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('tasteory_token');
            window.location.href = '/auth.html';
        });
    }
});