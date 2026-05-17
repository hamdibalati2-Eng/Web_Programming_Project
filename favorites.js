// Favorites Page JavaScript

const favoritesGrid = document.getElementById('favoritesGrid');
const emptyFavorites = document.getElementById('emptyFavorites');

// Load favorites
async function loadFavorites() {
    try {
        const response = await fetch('api/get_favorites.php');
        const data = await response.json();
        
        if (data.success && data.favorites && data.favorites.length > 0) {
            displayFavorites(data.favorites);
            favoritesGrid.style.display = 'grid';
            emptyFavorites.style.display = 'none';
        } else {
            favoritesGrid.style.display = 'none';
            emptyFavorites.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesGrid.style.display = 'none';
        emptyFavorites.style.display = 'block';
    }
}

// Display favorites
function displayFavorites(favorites) {
    favoritesGrid.innerHTML = '';
    
    favorites.forEach(recipe => {
        const card = createFavoriteCard(recipe);
        favoritesGrid.appendChild(card);
    });
}

// Create favorite card
function createFavoriteCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const imagePath = getImagePath(recipe);
    const description = (recipe.instructions || '').substring(0, 120) + '...';
    
    card.innerHTML = `
        <div class="recipe-image-wrapper">
            <img src="${imagePath}" alt="${recipe.name}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="recipe-badges">
                ${recipe.area ? `<span class="recipe-badge area">${recipe.area}</span>` : ''}
                ${recipe.category ? `<span class="recipe-badge">${recipe.category}</span>` : ''}
            </div>
            <div class="recipe-actions">
                <button class="recipe-action-btn favorite active" aria-label="Remove from favorites">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="recipe-action-btn share" aria-label="Share recipe">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
        <div class="recipe-info">
            <h3 class="recipe-name">${recipe.name}</h3>
            <p class="recipe-description">${description}</p>
            <div class="recipe-footer">
                <button class="btn-view-recipe">
                    View Recipe
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add click handlers
    const favoriteBtn = card.querySelector('.favorite');
    favoriteBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleFavorite(recipe.id, favoriteBtn);
        // Remove card from view
        card.remove();
        // Check if any favorites left
        if (favoritesGrid.children.length === 0) {
            favoritesGrid.style.display = 'none';
            emptyFavorites.style.display = 'block';
        }
        // Update count
        if (window.updateFavoritesCount) {
            window.updateFavoritesCount();
        }
    });
    
    const viewRecipeBtn = card.querySelector('.btn-view-recipe');
    viewRecipeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `recipe-detail.html?id=${recipe.id}`;
    });
    
    card.addEventListener('click', () => {
        window.location.href = `recipe-detail.html?id=${recipe.id}`;
    });
    
    return card;
}

// Get image path
function getImagePath(recipe) {
    if (recipe.image && recipe.image.startsWith('recipe_images/')) {
        return recipe.image;
    }
    if (recipe.id) {
        return `recipe_images/${recipe.id}.jpg`;
    }
    return recipe.image_url || 'https://via.placeholder.com/300x200?text=No+Image';
}

// Toggle favorite
async function toggleFavorite(recipeId, favoriteBtn) {
    try {
        const formData = new FormData();
        formData.append('recipe_id', recipeId);
        
        const response = await fetch('api/toggle_favorite.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (!data.is_favorite) {
                favoriteBtn.classList.remove('active');
                favoriteBtn.querySelector('i').classList.remove('fas');
                favoriteBtn.querySelector('i').classList.add('far');
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    initMobileMenu();
    initHeaderScroll();
    setActiveNavLink();
});

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
        if (currentPage === 'favorites.html' && link.dataset.page === 'favorites') {
            link.classList.add('active');
        }
    });
}

