// Recipes Page JavaScript

const API_BASE_URL = 'api/get_recipes.php';
const API_CATEGORIES = 'api/get_categories.php';
const API_AREAS = 'api/get_areas.php';
const API_INGREDIENTS = 'api/get_ingredients.php';

let allRecipes = [];
let filteredRecipes = [];
let categories = [];
let areas = [];
let ingredients = [];

// Filter state
const filters = {
    search: '',
    categories: [],
    areas: [],
    ingredientsInclude: [],
    ingredientsExclude: []
};

// UI Elements
const filterSidebar = document.getElementById('filterSidebar');
const filterToggle = document.getElementById('filterToggle');
const filterClose = document.getElementById('filterClose');
const recipeSearch = document.getElementById('recipeSearch');
const searchClear = document.getElementById('searchClear');
const ingredientInput = document.getElementById('ingredientInput');
const ingredientAutocomplete = document.getElementById('ingredientAutocomplete');
const categoryFilters = document.getElementById('categoryFilters');
const areaFilters = document.getElementById('areaFilters');
const includeTags = document.getElementById('includeTags');
const excludeTags = document.getElementById('excludeTags');
const recipesGrid = document.getElementById('recipesGrid');
const resultsCount = document.getElementById('resultsCount');
const activeFilters = document.getElementById('activeFilters');
const activeFilterCount = document.getElementById('activeFilterCount');
const sortSelect = document.getElementById('sortSelect');
const clearAllFiltersBtn = document.getElementById('clearAllFilters');
const noResults = document.getElementById('noResults');
const viewToggle = document.querySelectorAll('.view-btn');

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
            if (data.is_favorite) {
                favoriteBtn.classList.add('active');
                favoriteBtn.querySelector('i').classList.remove('far');
                favoriteBtn.querySelector('i').classList.add('fas');
            } else {
                favoriteBtn.classList.remove('active');
                favoriteBtn.querySelector('i').classList.remove('fas');
                favoriteBtn.querySelector('i').classList.add('far');
            }
            // Update favorites count in navbar
            updateFavoritesCount();
        } else {
            if (data.message && data.message.includes('Authentication')) {
                alert('Please login to add favorites');
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// Check favorite status
async function checkFavoriteStatus(recipeId, favoriteBtn) {
    try {
        const response = await fetch(`api/check_favorite.php?recipe_id=${encodeURIComponent(recipeId)}`);
        const data = await response.json();
        
        if (data.is_favorite) {
            favoriteBtn.classList.add('active');
            favoriteBtn.querySelector('i').classList.remove('far');
            favoriteBtn.querySelector('i').classList.add('fas');
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    initMobileMenu();
    initHeaderScroll();
    initScrollToTop();
    initEventListeners();
    loadInitialData();
});

// Ingredient mode state
let ingredientMode = 'include';

// Initialize Event Listeners
function initEventListeners() {
    // Filter sidebar toggle
    filterToggle?.addEventListener('click', () => {
        filterSidebar?.classList.add('active');
    });

    filterClose?.addEventListener('click', () => {
        filterSidebar?.classList.remove('active');
    });

    // Search
    recipeSearch?.addEventListener('input', debounce(handleSearch, 300));
    searchClear?.addEventListener('click', () => {
        recipeSearch.value = '';
        filters.search = '';
        searchClear.classList.remove('visible');
        applyFilters();
    });

    // Ingredient mode toggle
    document.querySelectorAll('.ingredient-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ingredient-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ingredientMode = btn.dataset.mode;
        });
    });

    // Ingredient autocomplete
    ingredientInput?.addEventListener('input', debounce(handleIngredientInput, 300));
    ingredientInput?.addEventListener('focus', () => {
        if (ingredientInput.value.length > 0) {
            showIngredientAutocomplete(ingredientInput.value);
        }
    });

    // Close autocomplete on outside click
    document.addEventListener('click', (e) => {
        if (!ingredientInput?.contains(e.target) && !ingredientAutocomplete?.contains(e.target)) {
            ingredientAutocomplete?.classList.remove('visible');
        }
    });

    // Sort
    sortSelect?.addEventListener('change', (e) => {
        applyFilters();
    });

    // View toggle
    viewToggle.forEach(btn => {
        btn.addEventListener('click', () => {
            viewToggle.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            recipesGrid.className = view === 'list' ? 'recipes-grid list-view' : 'recipes-grid';
            toggleRecipeDescriptions(view);
        });
    });

    // Clear all filters
    clearAllFiltersBtn?.addEventListener('click', clearAllFilters);
}

// Load initial data
async function loadInitialData() {
    try {
        // Check for search parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        
        if (searchParam) {
            // Apply search from URL parameter
            filters.search = searchParam;
            if (recipeSearch) {
                recipeSearch.value = searchParam;
                searchClear?.classList.add('visible');
            }
        }
        
        // Load recipes, categories, areas, and ingredients in parallel
        const [recipesData, categoriesData, areasData] = await Promise.all([
            fetch(API_BASE_URL).then(r => r.json()),
            fetch(API_CATEGORIES).then(r => r.json()),
            fetch(API_AREAS).then(r => r.json())
        ]);

        allRecipes = Array.isArray(recipesData) ? recipesData : [];
        categories = Array.isArray(categoriesData) ? categoriesData : [];
        areas = Array.isArray(areasData) ? areasData : [];

        // Populate filter checkboxes
        populateCategoryFilters();
        populateAreaFilters();

        // Apply filters (including search from URL)
        await applyFilters();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load recipes. Please refresh the page.');
    }
}

// Populate category filters
function populateCategoryFilters() {
    if (!categoryFilters) return;
    
    categoryFilters.innerHTML = '';
    categories.forEach(cat => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = `
            <input type="checkbox" value="${cat.category}" data-filter="category">
            <span>${cat.category} <small>(${cat.count})</small></span>
        `;
        label.querySelector('input').addEventListener('change', handleCategoryChange);
        categoryFilters.appendChild(label);
    });
}

// Populate area filters
function populateAreaFilters() {
    if (!areaFilters) return;
    
    areaFilters.innerHTML = '';
    areas.forEach(area => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = `
            <input type="checkbox" value="${area.area}" data-filter="area">
            <span>${area.area} <small>(${area.count})</small></span>
        `;
        label.querySelector('input').addEventListener('change', handleAreaChange);
        areaFilters.appendChild(label);
    });
}

// Handle category change
function handleCategoryChange(e) {
    const value = e.target.value;
    if (e.target.checked) {
        if (!filters.categories.includes(value)) {
            filters.categories.push(value);
        }
    } else {
        filters.categories = filters.categories.filter(c => c !== value);
    }
    applyFilters();
}

// Handle area change
function handleAreaChange(e) {
    const value = e.target.value;
    if (e.target.checked) {
        if (!filters.areas.includes(value)) {
            filters.areas.push(value);
        }
    } else {
        filters.areas = filters.areas.filter(a => a !== value);
    }
    applyFilters();
}

// Handle search
function handleSearch(e) {
    const value = e.target.value.trim();
    filters.search = value;
    
    if (value.length > 0) {
        searchClear?.classList.add('visible');
    } else {
        searchClear?.classList.remove('visible');
    }
    
    applyFilters();
}

// Handle ingredient input
async function handleIngredientInput(e) {
    const value = e.target.value.trim();
    if (value.length > 0) {
        showIngredientAutocomplete(value);
    } else {
        ingredientAutocomplete?.classList.remove('visible');
    }
}

// Show ingredient autocomplete
async function showIngredientAutocomplete(searchTerm) {
    try {
        const response = await fetch(`${API_INGREDIENTS}?search=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (!ingredientAutocomplete) return;
        
        ingredientAutocomplete.innerHTML = '';
        
        if (Array.isArray(data) && data.length > 0) {
            data.slice(0, 10).forEach(ing => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = `${ing.ingredient} (${ing.count})`;
                item.addEventListener('click', () => {
                    addIngredient(ing.ingredient, ingredientMode === 'exclude');
                    ingredientInput.value = '';
                    ingredientAutocomplete.classList.remove('visible');
                });
                ingredientAutocomplete.appendChild(item);
            });
            ingredientAutocomplete.classList.add('visible');
        } else {
            ingredientAutocomplete.classList.remove('visible');
        }
    } catch (error) {
        console.error('Error loading ingredients:', error);
    }
}

// Add ingredient to filter
function addIngredient(ingredient, exclude = false) {
    const list = exclude ? filters.ingredientsExclude : filters.ingredientsInclude;
    const tagContainer = exclude ? excludeTags : includeTags;
    
    if (!list.includes(ingredient)) {
        list.push(ingredient);
        renderIngredientTag(ingredient, exclude, tagContainer);
        applyFilters();
    }
}

// Toggle ingredient include/exclude
function toggleIngredientMode(ingredient) {
    // Remove from both lists first
    filters.ingredientsInclude = filters.ingredientsInclude.filter(i => i !== ingredient);
    filters.ingredientsExclude = filters.ingredientsExclude.filter(i => i !== ingredient);
    
    // Remove existing tags
    const includeTag = Array.from(includeTags.children).find(t => t.textContent.includes(ingredient));
    const excludeTag = Array.from(excludeTags.children).find(t => t.textContent.includes(ingredient));
    if (includeTag) includeTag.remove();
    if (excludeTag) excludeTag.remove();
    
    // Add to the other list
    addIngredient(ingredient, true);
}

// Render ingredient tag
function renderIngredientTag(ingredient, exclude, container) {
    const tag = document.createElement('div');
    tag.className = `ingredient-tag ${exclude ? 'exclude' : ''}`;
    tag.innerHTML = `
        <span>${ingredient}</span>
        <button type="button" aria-label="Remove ${ingredient}">
            <i class="fas fa-times"></i>
        </button>
    `;
    tag.querySelector('button').addEventListener('click', () => {
        const list = exclude ? filters.ingredientsExclude : filters.ingredientsInclude;
        const index = list.indexOf(ingredient);
        if (index > -1) {
            list.splice(index, 1);
        }
        tag.remove();
        applyFilters();
    });
    container.appendChild(tag);
}

// Apply all filters
async function applyFilters() {
    try {
        // Build query parameters
        const params = new URLSearchParams();
        
        if (filters.search) {
            params.append('search', filters.search);
        }
        
        if (filters.categories.length > 0) {
            params.append('category', filters.categories.join(','));
        }
        
        if (filters.areas.length > 0) {
            params.append('area', filters.areas.join(','));
        }
        
        if (filters.ingredientsInclude.length > 0) {
            params.append('ingredient', filters.ingredientsInclude.join(','));
        }
        
        if (filters.ingredientsExclude.length > 0) {
            params.append('ingredient_exclude', filters.ingredientsExclude.join(','));
        }
        
        const sort = sortSelect?.value || 'name_asc';
        params.append('sort', sort);
        
        // Fetch filtered recipes
        const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
        const data = await response.json();
        
        filteredRecipes = Array.isArray(data) ? data : [];
        
        // Render results
        renderRecipes();
        updateResultsCount();
        updateActiveFilters();
    } catch (error) {
        console.error('Error applying filters:', error);
        showError('Error applying filters. Please try again.');
    }
}


// Render recipes
function renderRecipes() {
    if (!recipesGrid) return;
    
    if (filteredRecipes.length === 0) {
        recipesGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    recipesGrid.style.display = 'grid';
    noResults.style.display = 'none';
    recipesGrid.innerHTML = '';
    
    filteredRecipes.forEach((recipe, index) => {
        const card = createRecipeCard(recipe);
        card.style.animationDelay = `${index * 0.05}s`;
        recipesGrid.appendChild(card);
    });
    
    // Apply current view mode to descriptions
    const activeView = document.querySelector('.view-btn.active')?.dataset.view || 'grid';
    toggleRecipeDescriptions(activeView);
}

// Toggle recipe descriptions based on view mode
function toggleRecipeDescriptions(view) {
    const descriptions = document.querySelectorAll('.recipe-description');
    descriptions.forEach(desc => {
        if (view === 'list') {
            desc.style.display = 'none';
        } else {
            desc.style.display = 'block';
        }
    });
}

// Create recipe card
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const imagePath = getImagePath(recipe);
    const description = (recipe.instructions || '').substring(0, 120) + '...';
    const ingredientsPreview = (recipe.ingredients || [])
        .slice(0, 3)
        .map(ing => ing.ingredient)
        .join(', ');
    
    card.innerHTML = `
        <div class="recipe-image-wrapper">
            <img src="${imagePath}" alt="${recipe.name}" loading="lazy"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="recipe-badges">
                ${recipe.area ? `<span class="recipe-badge area">${recipe.area}</span>` : ''}
                ${recipe.category ? `<span class="recipe-badge">${recipe.category}</span>` : ''}
            </div>
            <div class="recipe-actions">
                <button class="recipe-action-btn favorite" aria-label="Add to favorites">
                    <i class="far fa-heart"></i>
                </button>
                <button class="recipe-action-btn share" aria-label="Share recipe">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
        <div class="recipe-info">
            <h3 class="recipe-name">${recipe.name}</h3>
            <p class="recipe-description">${description}</p>
            ${ingredientsPreview ? `<div class="recipe-meta">
                <div class="recipe-meta-item">
                    <i class="fas fa-carrot"></i>
                    <span>${ingredientsPreview}</span>
                </div>
            </div>` : ''}
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
    });
    
    // Check if recipe is already favorited
    checkFavoriteStatus(recipe.id, favoriteBtn);
    
    const shareBtn = card.querySelector('.share');
    shareBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        shareRecipe(recipe);
    });
    
    const viewRecipeBtn = card.querySelector('.btn-view-recipe');
    viewRecipeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Navigate to recipe detail page with recipe ID
        window.location.href = `recipe-detail.html?id=${recipe.id}`;
    });
    
    // Also allow clicking the card to view recipe
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

// Share recipe
function shareRecipe(recipe) {
    if (navigator.share) {
        navigator.share({
            title: recipe.name,
            text: `Check out this recipe: ${recipe.name}`,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        const url = `${window.location.origin}${window.location.pathname}?recipe=${recipe.id}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Recipe link copied to clipboard!');
        });
    }
}

// Update results count
function updateResultsCount() {
    if (!resultsCount) return;
    const total = allRecipes.length;
    const showing = filteredRecipes.length;
    resultsCount.textContent = `Showing ${showing} of ${total} recipes`;
}

// Update active filters display
function updateActiveFilters() {
    if (!activeFilters || !activeFilterCount) return;
    
    activeFilters.innerHTML = '';
    let count = 0;
    
    // Search
    if (filters.search) {
        addActiveFilterTag('Search', filters.search, () => {
            filters.search = '';
            recipeSearch.value = '';
            searchClear.classList.remove('visible');
            applyFilters();
        });
        count++;
    }
    
    // Categories
    filters.categories.forEach(cat => {
        addActiveFilterTag('Category', cat, () => {
            filters.categories = filters.categories.filter(c => c !== cat);
            const checkbox = document.querySelector(`input[data-filter="category"][value="${cat}"]`);
            if (checkbox) checkbox.checked = false;
            applyFilters();
        });
        count++;
    });
    
    // Areas
    filters.areas.forEach(area => {
        addActiveFilterTag('Cuisine', area, () => {
            filters.areas = filters.areas.filter(a => a !== area);
            const checkbox = document.querySelector(`input[data-filter="area"][value="${area}"]`);
            if (checkbox) checkbox.checked = false;
            applyFilters();
        });
        count++;
    });
    
    // Ingredients include
    filters.ingredientsInclude.forEach(ing => {
        addActiveFilterTag('Include', ing, () => {
            filters.ingredientsInclude = filters.ingredientsInclude.filter(i => i !== ing);
            const tag = Array.from(includeTags.children).find(t => t.textContent.includes(ing));
            if (tag) tag.remove();
            applyFilters();
        });
        count++;
    });
    
    // Ingredients exclude
    filters.ingredientsExclude.forEach(ing => {
        addActiveFilterTag('Exclude', ing, () => {
            filters.ingredientsExclude = filters.ingredientsExclude.filter(i => i !== ing);
            const tag = Array.from(excludeTags.children).find(t => t.textContent.includes(ing));
            if (tag) tag.remove();
            applyFilters();
        });
        count++;
    });
    
    activeFilterCount.textContent = count;
}

// Add active filter tag
function addActiveFilterTag(label, value, onRemove) {
    const tag = document.createElement('div');
    tag.className = 'active-filter-tag';
    tag.innerHTML = `
        <span><strong>${label}:</strong> ${value}</span>
        <button type="button" aria-label="Remove filter">
            <i class="fas fa-times"></i>
        </button>
    `;
    tag.querySelector('button').addEventListener('click', onRemove);
    activeFilters.appendChild(tag);
}

// Clear all filters
function clearAllFilters() {
    filters.search = '';
    filters.categories = [];
    filters.areas = [];
    filters.ingredientsInclude = [];
    filters.ingredientsExclude = [];
    
    // Reset UI
    recipeSearch.value = '';
    searchClear.classList.remove('visible');
    ingredientInput.value = '';
    includeTags.innerHTML = '';
    excludeTags.innerHTML = '';
    
    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    applyFilters();
}

// Show error message
function showError(message) {
    if (resultsCount) {
        resultsCount.textContent = message;
        resultsCount.style.color = '#ef4444';
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

// Scroll to Top Button
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (!scrollToTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    // Scroll to top when clicked
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Make clearAllFilters available globally for onclick
window.clearAllFilters = clearAllFilters;

