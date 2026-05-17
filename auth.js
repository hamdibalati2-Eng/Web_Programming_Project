// Shared Authentication Script for all pages

// Check authentication and update navbar
async function checkAuthAndUpdateNavbar() {
    try {
        const response = await fetch('api/check_auth.php');
        const data = await response.json();
        
        if (data.authenticated) {
            updateNavbarForAuth(data);
        } else {
            // Check localStorage as fallback
            if (localStorage.getItem('is_logged_in') === 'true') {
                updateNavbarForAuth({
                    first_name: localStorage.getItem('user_name') || '',
                    last_name: localStorage.getItem('user_surname') || '',
                    email: localStorage.getItem('user_email') || ''
                });
            } else {
                updateNavbarForGuest();
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // Check localStorage as fallback
        if (localStorage.getItem('is_logged_in') === 'true') {
            updateNavbarForAuth({
                first_name: localStorage.getItem('user_name') || '',
                last_name: localStorage.getItem('user_surname') || '',
                email: localStorage.getItem('user_email') || ''
            });
        } else {
            updateNavbarForGuest();
        }
    }
}

// Update navbar for authenticated user
function updateNavbarForAuth(userData) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const profileLink = document.getElementById('profileLink');
    const favoritesLink = document.getElementById('favoritesLink');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const favoritesCount = document.getElementById('favoritesCount');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
        userMenu.style.display = 'flex';
        userMenu.style.alignItems = 'center';
        userMenu.style.gap = '1rem';
    }
    if (profileLink) profileLink.style.display = 'block';
    if (favoritesLink) favoritesLink.style.display = 'block';
    if (userNameDisplay) {
        const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User';
        userNameDisplay.textContent = `Welcome back, ${fullName}`;
    }
    
    // Update favorites count
    updateFavoritesCount();
    
    // Remove existing event listeners by cloning and replacing
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', async () => {
            try {
                await fetch('api/logout.php');
                localStorage.removeItem('is_logged_in');
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');
                localStorage.removeItem('user_surname');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    
    // Update login/signup buttons to redirect
    document.querySelectorAll('.btn-login, .btn-signup').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = newBtn.classList.contains('btn-login') ? 'login.html' : 'register.html';
        });
    });
}

// Update favorites count
async function updateFavoritesCount() {
    const favoritesCount = document.getElementById('favoritesCount');
    if (!favoritesCount) return;
    
    try {
        const response = await fetch('api/get_favorites_count.php');
        const data = await response.json();
        const count = data.count || 0;
        
        if (count > 0) {
            favoritesCount.textContent = `(${count})`;
            favoritesCount.style.display = 'inline';
        } else {
            favoritesCount.textContent = '';
            favoritesCount.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating favorites count:', error);
    }
}

// Make updateFavoritesCount available globally
window.updateFavoritesCount = updateFavoritesCount;

// Update navbar for guest
function updateNavbarForGuest() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const profileLink = document.getElementById('profileLink');
    const favoritesLink = document.getElementById('favoritesLink');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (favoritesLink) favoritesLink.style.display = 'none';
    
    // Add click handlers for login/signup
    document.querySelectorAll('.btn-login, .btn-signup').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = newBtn.classList.contains('btn-login') ? 'login.html' : 'register.html';
        });
    });
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndUpdateNavbar();
});

// Also check on page show (for back/forward navigation)
window.addEventListener('pageshow', () => {
    checkAuthAndUpdateNavbar();
});

