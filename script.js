// API endpoint for fetching recipes from database
const API_BASE_URL = 'api/get_recipes.php';

let allRecipes = [];

// Load all recipes from database
async function loadAllRecipes() {
    try {
        console.log('Starting to load recipes from database...');
        
        // Fetch all recipes from the API
        const response = await fetch(API_BASE_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recipes = await response.json();
        
        if (!Array.isArray(recipes)) {
            throw new Error('Invalid response format from API');
        }
        
        // Filter out any invalid recipes
        allRecipes = recipes.filter(recipe => recipe && recipe.id);
        console.log('Total recipes loaded from database:', allRecipes.length);

        // If no recipes loaded, show error
        if (allRecipes.length === 0) {
            console.error('No recipes found in database');
            alert('No recipes found in database.\nPlease make sure:\n1. Database is set up correctly\n2. Recipes have been imported\n3. XAMPP MySQL is running');
            return;
        }

        // Remove duplicates by id (just in case)
        const uniqueRecipes = [];
        const seenIds = new Set();
        
        for (const recipe of allRecipes) {
            if (!seenIds.has(recipe.id)) {
                seenIds.add(recipe.id);
                uniqueRecipes.push(recipe);
            }
        }
        
        allRecipes = uniqueRecipes;
        console.log('Unique recipes:', allRecipes.length);

        // Shuffle recipes for variety
        allRecipes = shuffleArray(allRecipes);

        // Create the cards
        createFloatingCards();
        createRecipeGrid();
        
        console.log('Page loaded successfully with', allRecipes.length, 'recipes from database');
        
    } catch (error) {
        console.error('Error loading recipes from database:', error);
        alert('Error loading recipes from database.\n\nPlease check:\n1. XAMPP Apache and MySQL are running\n2. Database connection is working\n3. API endpoint is accessible\n\nError: ' + error.message);
    }
}

// Shuffle array for random display
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Calculate random nutritional info
function generateNutrition() {
    return {
        calories: Math.floor(Math.random() * (550 - 350) + 350),
        protein: Math.floor(Math.random() * (40 - 20) + 20),
        carbs: Math.floor(Math.random() * (60 - 30) + 30),
        fat: Math.floor(Math.random() * (25 - 10) + 10)
    };
}

// Load recipes by category from database (for filtering)
async function loadRecipesByCategory(category) {
    try {
        const url = category ? `${API_BASE_URL}?category=${encodeURIComponent(category)}` : API_BASE_URL;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recipes = await response.json();
        return Array.isArray(recipes) ? recipes.filter(recipe => recipe && recipe.id) : [];
    } catch (error) {
        console.error('Error loading recipes by category:', error);
        return [];
    }
}

// Search recipes in database
async function searchRecipes(searchTerm) {
    try {
        const url = `${API_BASE_URL}?search=${encodeURIComponent(searchTerm)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recipes = await response.json();
        return Array.isArray(recipes) ? recipes.filter(recipe => recipe && recipe.id) : [];
    } catch (error) {
        console.error('Error searching recipes:', error);
        return [];
    }
}

// Get image path - use local image if available, fallback to URL
function getImagePath(recipe) {
    // Try local image first (from database)
    if (recipe.image && recipe.image.startsWith('recipe_images/')) {
        return recipe.image;
    }
    // Use recipe id for local image
    if (recipe.id) {
        return `recipe_images/${recipe.id}.jpg`;
    }
    // Fallback to image_url if available
    return recipe.image_url || 'https://via.placeholder.com/300x200?text=No+Image';
}

// Create floating cards
function createFloatingCards() {
    const container = document.getElementById('floatingCards');
    container.innerHTML = ''; // Clear existing cards
    
    const recipesToShow = allRecipes.slice(0, 6);
    
    recipesToShow.forEach((recipe, index) => {
        const card = document.createElement('div');
        card.className = 'floating-card';
        const imagePath = getImagePath(recipe);
        
        card.innerHTML = `
            <img src="${imagePath}" alt="${recipe.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="card-title">${recipe.name}</div>
        `;
        card.onclick = () => showRecipeDetails(recipe);
        container.appendChild(card);
    });
}

// Create bottom recipe grid
function createRecipeGrid() {
    const container = document.getElementById('recipeGrid');
    container.innerHTML = ''; // Clear existing cards
    
    const recipesToShow = allRecipes.slice(6, 10);
    
    recipesToShow.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        const imagePath = getImagePath(recipe);
        
        // Get ingredients list (just names)
        let ingredientsHtml = '';
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            const ingredientNames = recipe.ingredients
                .slice(0, 5) // Show first 5 ingredients
                .map(ing => ing.ingredient || '')
                .filter(name => name.trim() !== '');
            
            if (ingredientNames.length > 0) {
                ingredientsHtml = `<div class="recipe-ingredients">${ingredientNames.join(', ')}</div>`;
            }
        }
        
        card.innerHTML = `
            <img src="${imagePath}" alt="${recipe.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="recipe-info">
                <div class="recipe-name">${recipe.name}</div>
                ${ingredientsHtml}
            </div>
        `;
        card.onclick = () => showRecipeDetails(recipe);
        container.appendChild(card);
    });
}

// Show recipe details (you can expand this later)
function showRecipeDetails(recipe) {
    // Navigate to recipe detail page
    window.location.href = `recipe-detail.html?id=${recipe.id}`;
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
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
    const searchSection = document.querySelector('.search-section');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide search section when scrolling down, show when scrolling up
        if (searchSection) {
            if (currentScroll > lastScroll && currentScroll > 100) {
                // Scrolling down
                searchSection.style.transform = 'translateY(-100%)';
                searchSection.style.opacity = '0';
                searchSection.style.maxHeight = '0';
                searchSection.style.marginBottom = '0';
            } else {
                // Scrolling up or at top
                searchSection.style.transform = 'translateY(0)';
                searchSection.style.opacity = '1';
                searchSection.style.maxHeight = 'none';
                searchSection.style.marginBottom = '1.2rem';
            }
        }
        
        lastScroll = currentScroll;
    });
}

// Initialize search bar redirect
function initSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;
    
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchBar.value.trim();
            if (searchTerm) {
                // Redirect to recipes page with search parameter
                window.location.href = `recipes.html?search=${encodeURIComponent(searchTerm)}`;
            } else {
                // If empty, just go to recipes page
                window.location.href = 'recipes.html';
            }
        }
    });
    
    // Also handle search on input blur (when user clicks away)
    searchBar.addEventListener('blur', () => {
        const searchTerm = searchBar.value.trim();
        if (searchTerm) {
            // Optional: redirect on blur too, or just on Enter
            // Uncomment if you want blur redirect:
            // window.location.href = `recipes.html?search=${encodeURIComponent(searchTerm)}`;
        }
    });
}

// Set active navigation link
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a[data-page]');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        // Check if this is the current page
        if (currentPage === 'index.html' || currentPage === '') {
            if (link.dataset.page === 'home') {
                link.classList.add('active');
            }
        } else if (currentPage === 'recipes.html') {
            if (link.dataset.page === 'recipes') {
                link.classList.add('active');
            }
        } else if (currentPage === 'recipe-detail.html') {
            if (link.dataset.page === 'recipes') {
                link.classList.add('active');
            }
        }
    });
}

// Initialize page - load recipes when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setActiveNavLink();
        loadAllRecipes();
        initMobileMenu();
        initHeaderScroll();
        initSearchBar();
    });
} else {
    setActiveNavLink();
    loadAllRecipes();
    initMobileMenu();
    initHeaderScroll();
    initSearchBar();
}

