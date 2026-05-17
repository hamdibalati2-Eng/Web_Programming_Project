// Profile Page JavaScript

// UI Elements
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const userFullName = document.getElementById('userFullName');
const userEmail = document.getElementById('userEmail');
const userAvatar = document.getElementById('userAvatar');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const passwordSuccessMessage = document.getElementById('passwordSuccessMessage');
const passwordErrorMessage = document.getElementById('passwordErrorMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthForProfile();
    loadUserProfile();
    checkAdminStatus();
    initMobileMenu();
    initHeaderScroll();
    setActiveNavLink();
    
    profileForm?.addEventListener('submit', handleProfileUpdate);
    passwordForm?.addEventListener('submit', handlePasswordChange);
});

// Check authentication for profile page (redirect if not logged in)
async function checkAuthForProfile() {
    try {
        const response = await fetch('api/check_auth.php');
        const data = await response.json();
        
        if (!data.authenticated) {
            // Check localStorage as fallback
            if (localStorage.getItem('is_logged_in') !== 'true') {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // Check localStorage as fallback
        if (localStorage.getItem('is_logged_in') !== 'true') {
            window.location.href = 'login.html';
        }
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch('api/get_profile.php');
        const data = await response.json();
        
        if (data.success) {
            firstNameInput.value = data.first_name || '';
            lastNameInput.value = data.last_name || '';
            emailInput.value = data.email || '';
            
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';
            userFullName.textContent = fullName;
            userEmail.textContent = data.email || '';
            userAvatar.textContent = (data.first_name?.[0] || 'U').toUpperCase();
        } else {
            // Fallback to localStorage
            const firstName = localStorage.getItem('user_name') || '';
            const lastName = localStorage.getItem('user_surname') || '';
            const email = localStorage.getItem('user_email') || '';
            
            firstNameInput.value = firstName;
            lastNameInput.value = lastName;
            emailInput.value = email;
            
            const fullName = `${firstName} ${lastName}`.trim() || 'User';
            userFullName.textContent = fullName;
            userEmail.textContent = email;
            userAvatar.textContent = (firstName[0] || 'U').toUpperCase();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to localStorage
        const firstName = localStorage.getItem('user_name') || '';
        const lastName = localStorage.getItem('user_surname') || '';
        const email = localStorage.getItem('user_email') || '';
        
        firstNameInput.value = firstName;
        lastNameInput.value = lastName;
        emailInput.value = email;
        
        const fullName = `${firstName} ${lastName}`.trim() || 'User';
        userFullName.textContent = fullName;
        userEmail.textContent = email;
        userAvatar.textContent = (firstName[0] || 'U').toUpperCase();
    }
}

// Check admin status and show admin button
async function checkAdminStatus() {
    try {
        const response = await fetch('api/admin/check_admin.php');
        const data = await response.json();
        
        if (data.is_admin) {
            const adminButtonContainer = document.getElementById('adminButtonContainer');
            if (adminButtonContainer) {
                adminButtonContainer.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    hideMessages();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('api/update_profile.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update localStorage
            localStorage.setItem('user_name', data.first_name || '');
            localStorage.setItem('user_surname', data.last_name || '');
            localStorage.setItem('user_email', data.email || '');
            
            // Update display
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';
            userFullName.textContent = fullName;
            userEmail.textContent = data.email || '';
            userAvatar.textContent = (data.first_name?.[0] || 'U').toUpperCase();
            
            successMessage.textContent = 'Profile updated successfully!';
            successMessage.classList.add('show');
            
            // Update navbar
            updateNavbarForAuth(data);
        } else {
            errorMessage.textContent = data.message || 'Failed to update profile';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.classList.add('show');
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    hidePasswordMessages();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        passwordErrorMessage.textContent = 'New passwords do not match!';
        passwordErrorMessage.classList.add('show');
        return;
    }
    
    if (newPassword.length < 6) {
        passwordErrorMessage.textContent = 'Password must be at least 6 characters long!';
        passwordErrorMessage.classList.add('show');
        return;
    }
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('api/change_password.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            passwordSuccessMessage.textContent = 'Password changed successfully!';
            passwordSuccessMessage.classList.add('show');
            e.target.reset();
        } else {
            passwordErrorMessage.textContent = data.message || 'Failed to change password';
            passwordErrorMessage.classList.add('show');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        passwordErrorMessage.textContent = 'An error occurred. Please try again.';
        passwordErrorMessage.classList.add('show');
    }
}

// Hide messages
function hideMessages() {
    successMessage.classList.remove('show');
    errorMessage.classList.remove('show');
}

function hidePasswordMessages() {
    passwordSuccessMessage.classList.remove('show');
    passwordErrorMessage.classList.remove('show');
}

// Note: Navbar auth is handled by auth.js

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }
}

// Header Scroll Effect
function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Set active navigation link
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a[data-page]');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (currentPage === 'profile.html' && link.dataset.page === 'profile') {
            link.classList.add('active');
        }
    });
}

