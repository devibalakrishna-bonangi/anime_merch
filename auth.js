// Auth Utilities

const API_URL = 'http://localhost:4000'; // json-server default port

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
}

function updateNav() {
    const user = getCurrentUser();
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const adminLink = document.getElementById('admin-link');
    const usernameDisplay = document.getElementById('username-display');
    const avatar = document.getElementById('user-avatar');
    const roleEl = document.getElementById('user-role');

    if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (usernameDisplay) usernameDisplay.textContent = user.name || user.email || 'User';

        // show role badge
        if (roleEl) {
            roleEl.textContent = (user.role || '').toUpperCase();
            roleEl.style.display = user.role ? 'inline-block' : 'none';
        }

        // avatar initials
        if (avatar) {
            const name = user.name || user.email || '';
            const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';
            avatar.textContent = initials;
        }

        if (user.role === 'admin' && adminLink) {
            adminLink.style.display = 'block';
        }
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateNav();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
