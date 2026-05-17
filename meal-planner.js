// Meal Planner JavaScript

const API_BASE_URL = 'api/get_recipes.php';
const API_SAVE_MEAL_PLAN = 'api/save_meal_plan.php';
const API_GET_MEAL_PLAN = 'api/get_meal_plan.php';
let allRecipes = [];
let currentWeekStart = getWeekStart(new Date());
let mealPlan = {};
let isLoggedIn = false;

// UI Elements
const authModal = document.getElementById('authModal');
const autoSaveNotification = document.getElementById('autoSaveNotification');
const recipeLibrary = document.getElementById('recipeLibrary');
const libraryContent = document.getElementById('libraryContent');
const recipeSearchInput = document.getElementById('recipeSearchInput');
const currentWeekDisplay = document.getElementById('currentWeek');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const clearWeekBtn = document.getElementById('clearWeekBtn');
const generateShoppingListBtn = document.getElementById('generateShoppingListBtn');
const API_GENERATE_SHOPPING_LIST = 'api/generate_shopping_list.php';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthForMealPlanner();
    initMobileMenu();
    initHeaderScroll();
    setActiveNavLink();
    initEventListeners();
    await loadMealPlanFromDB();
    updateWeekDisplay();
    loadRecipes();
});

// Authentication Check for Meal Planner (separate from navbar auth)
async function checkAuthForMealPlanner() {
    try {
        const response = await fetch('api/check_auth.php');
        const data = await response.json();
        
        if (data.authenticated) {
            isLoggedIn = true;
            if (authModal) authModal.classList.remove('active');
        } else {
            // Check localStorage as fallback
            if (localStorage.getItem('is_logged_in') === 'true') {
                isLoggedIn = true;
                if (authModal) authModal.classList.remove('active');
            } else {
                isLoggedIn = false;
                if (authModal) authModal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // Check localStorage as fallback
        if (localStorage.getItem('is_logged_in') === 'true') {
            isLoggedIn = true;
            if (authModal) authModal.classList.remove('active');
        } else {
            isLoggedIn = false;
            if (authModal) authModal.classList.add('active');
        }
    }
}

// Handle authentication
function handleAuth(type) {
    window.location.href = type === 'login' ? 'login.html' : 'register.html';
}

// Make handleAuth available globally
window.handleAuth = handleAuth;

// Initialize Event Listeners
function initEventListeners() {
    // Week navigation
    prevWeekBtn?.addEventListener('click', async () => {
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        await loadMealPlanFromDB();
        updateWeekDisplay();
    });

    nextWeekBtn?.addEventListener('click', async () => {
        currentWeekStart = new Date(currentWeekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        await loadMealPlanFromDB();
        updateWeekDisplay();
    });

    // Clear week
    clearWeekBtn?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all meals for this week?')) {
            const weekKey = getWeekKey(currentWeekStart);
            mealPlan[weekKey] = {};
            await saveMealPlanToDB();
            renderMealPlan();
            showAutoSave();
        }
    });

    // Recipe search
    recipeSearchInput?.addEventListener('input', debounce(handleRecipeSearch, 300));
    
    // Generate shopping list button
    generateShoppingListBtn?.addEventListener('click', generateShoppingListAndNavigate);
}

// Generate shopping list and navigate to shopping list page
async function generateShoppingListAndNavigate() {
    if (!isLoggedIn) {
        // For non-logged-in users, just navigate
        window.location.href = 'shopping-list.html';
        return;
    }
    
    try {
        // Show loading state
        if (generateShoppingListBtn) {
            generateShoppingListBtn.disabled = true;
            generateShoppingListBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }
        
        const weekStartDate = formatDateForDB(currentWeekStart);
        
        // Call the generate API
        const response = await fetch(API_GENERATE_SHOPPING_LIST, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week_start: weekStartDate })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Navigate to shopping list page
            window.location.href = 'shopping-list.html';
        } else {
            alert(data.message || 'No meals found for this week. Please add some meals first.');
            // Reset button
            if (generateShoppingListBtn) {
                generateShoppingListBtn.disabled = false;
                generateShoppingListBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Generate Shopping List';
            }
        }
    } catch (error) {
        console.error('Error generating shopping list:', error);
        alert('Error generating shopping list. Please try again.');
        // Reset button
        if (generateShoppingListBtn) {
            generateShoppingListBtn.disabled = false;
            generateShoppingListBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Generate Shopping List';
        }
    }
}

// Get week start (Monday)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

// Get week key for storage
function getWeekKey(date) {
    const weekStart = getWeekStart(date);
    return `${weekStart.getFullYear()}-W${getWeekNumber(weekStart)}`;
}

// Get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Update week display
function updateWeekDisplay() {
    if (!currentWeekDisplay) return;
    
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric' };
    const startStr = currentWeekStart.toLocaleDateString('en-US', options);
    const endStr = weekEnd.toLocaleDateString('en-US', options);
    
    currentWeekDisplay.textContent = `${startStr} - ${endStr}`;
    
    // Update day dates
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach((day, index) => {
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(dayDate.getDate() + index);
        const dateElement = document.querySelector(`[data-date="${day.substring(0, 3)}"]`);
        if (dateElement) {
            dateElement.textContent = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    });
    
    renderMealPlan();
}

// Load recipes
async function loadRecipes() {
    try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        allRecipes = Array.isArray(data) ? data : [];
        renderRecipeLibrary();
    } catch (error) {
        console.error('Error loading recipes:', error);
        libraryContent.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Error loading recipes. Please refresh the page.</p>';
    }
}

// Render recipe library
function renderRecipeLibrary(filteredRecipes = null) {
    if (!libraryContent) return;
    
    const recipes = filteredRecipes || allRecipes;
    
    if (recipes.length === 0) {
        libraryContent.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No recipes found</p>';
        return;
    }
    
    libraryContent.innerHTML = '';
    
    recipes.forEach(recipe => {
        const item = createRecipeLibraryItem(recipe);
        libraryContent.appendChild(item);
    });
}

// Create recipe library item
function createRecipeLibraryItem(recipe) {
    const item = document.createElement('div');
    item.className = 'recipe-library-item';
    item.draggable = true;
    item.dataset.recipeId = recipe.id;
    
    const imagePath = getImagePath(recipe);
    
    item.innerHTML = `
        <img src="${imagePath}" alt="${recipe.name}" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
        <div class="recipe-library-item-info">
            <h3>${recipe.name}</h3>
            <div class="recipe-category">${recipe.category || 'Uncategorized'}</div>
        </div>
        <i class="fas fa-grip-vertical"></i>
    `;
    
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: recipe.id,
            name: recipe.name,
            image: imagePath,
            category: recipe.category
        }));
        item.classList.add('dragging');
    });
    
    item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
    });
    
    return item;
}

// Get image path
function getImagePath(recipe) {
    if (recipe.image && recipe.image.startsWith('recipe_images/')) {
        return recipe.image;
    }
    if (recipe.id) {
        return `recipe_images/${recipe.id}.jpg`;
    }
    return recipe.image_url || 'https://via.placeholder.com/60x60?text=No+Image';
}

// Handle recipe search
function handleRecipeSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (searchTerm === '') {
        renderRecipeLibrary();
        return;
    }
    
    const filtered = allRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchTerm) ||
        (recipe.category && recipe.category.toLowerCase().includes(searchTerm)) ||
        (recipe.area && recipe.area.toLowerCase().includes(searchTerm))
    );
    
    renderRecipeLibrary(filtered);
}

// Allow drop - improved to prevent event bubbling
function allowDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    // Only add drag-over to the exact slot, not parent elements
    if (e.currentTarget.classList.contains('day-slot')) {
        e.currentTarget.classList.add('drag-over');
    }
}

// Remove drag-over class on dragleave
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.classList.contains('day-slot')) {
        e.currentTarget.classList.remove('drag-over');
    }
}

// Handle dragover - prevent default and stop propagation
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    // Only highlight the exact slot being hovered
    const slot = e.target.closest('.day-slot');
    if (slot) {
        // Remove drag-over from all slots first
        document.querySelectorAll('.day-slot').forEach(s => s.classList.remove('drag-over'));
        // Add to current slot
        slot.classList.add('drag-over');
    }
}

// Handle drop - improved to ensure single slot drop
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove drag-over from all slots
    document.querySelectorAll('.day-slot').forEach(s => s.classList.remove('drag-over'));
    
    // Get the exact slot that was dropped on
    const slot = e.target.closest('.day-slot');
    if (!slot) return;
    
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    
    try {
        const recipe = JSON.parse(data);
        const day = slot.dataset.day;
        const time = slot.dataset.time;
        
        if (day && time) {
            addMealToSlot(day, time, recipe);
            saveMealPlanToDB();
            showAutoSave();
        }
    } catch (error) {
        console.error('Error parsing drop data:', error);
    }
}

// Make functions available globally for inline handlers
window.allowDrop = allowDrop;
window.handleDrop = handleDrop;
window.handleDragLeave = handleDragLeave;
window.handleDragOver = handleDragOver;

// Add meal to slot
function addMealToSlot(day, time, recipe) {
    const weekKey = getWeekKey(currentWeekStart);
    if (!mealPlan[weekKey]) {
        mealPlan[weekKey] = {};
    }
    if (!mealPlan[weekKey][day]) {
        mealPlan[weekKey][day] = {};
    }
    
    mealPlan[weekKey][day][time] = recipe;
    renderMealPlan();
}

// Remove meal from slot
async function removeMealFromSlot(day, time) {
    const weekKey = getWeekKey(currentWeekStart);
    if (mealPlan[weekKey] && mealPlan[weekKey][day] && mealPlan[weekKey][day][time]) {
        delete mealPlan[weekKey][day][time];
        await saveMealPlanToDB();
        renderMealPlan();
        showAutoSave();
    }
}

// Render meal plan
function renderMealPlan() {
    const weekKey = getWeekKey(currentWeekStart);
    const weekMeals = mealPlan[weekKey] || {};
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const times = ['breakfast', 'lunch', 'dinner', 'snacks'];
    
    days.forEach(day => {
        times.forEach(time => {
            const slot = document.querySelector(`[data-day="${day}"][data-time="${time}"]`);
            if (!slot) return;
            
            slot.innerHTML = '';
            slot.classList.remove('empty');
            
            const meal = weekMeals[day] && weekMeals[day][time];
            if (meal) {
                const mealCard = createMealCard(meal, day, time);
                slot.appendChild(mealCard);
            } else {
                slot.classList.add('empty');
            }
        });
    });
}

// Create meal card
function createMealCard(recipe, day, time) {
    const card = document.createElement('div');
    card.className = 'planned-meal';
    card.draggable = true;
    
    card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='https://via.placeholder.com/200x60?text=No+Image'">
        <h4>${recipe.name}</h4>
        <div class="meal-category">${recipe.category || ''}</div>
        <div class="planned-meal-actions">
            <button onclick="removeMealFromSlot('${day}', '${time}')" aria-label="Remove meal">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', JSON.stringify(recipe));
        card.classList.add('dragging');
        // Remove from current slot immediately to prevent visual issues
        setTimeout(() => {
            if (card.parentElement) {
                card.style.display = 'none';
            }
        }, 0);
    });
    
    card.addEventListener('dragend', (e) => {
        e.stopPropagation();
        card.classList.remove('dragging');
        card.style.display = '';
    });
    
    // Prevent card drag from affecting parent slot
    card.addEventListener('dragover', (e) => {
        e.stopPropagation();
    });
    
    card.addEventListener('drop', (e) => {
        e.stopPropagation();
    });
    
    return card;
}

// Make removeMealFromSlot available globally
window.removeMealFromSlot = removeMealFromSlot;

// Save meal plan to database
async function saveMealPlanToDB() {
    if (!isLoggedIn) {
        // Fallback to localStorage if not logged in
        try {
            localStorage.setItem('mealplanner_plan', JSON.stringify(mealPlan));
        } catch (error) {
            console.error('Error saving meal plan to localStorage:', error);
        }
        return;
    }
    
    try {
        const weekKey = getWeekKey(currentWeekStart);
        const weekMeals = mealPlan[weekKey] || {};
        
        // Format week start date (YYYY-MM-DD)
        const weekStartDate = formatDateForDB(currentWeekStart);
        
        // Convert meal plan to array format
        const mealsArray = [];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const times = ['breakfast', 'lunch', 'dinner', 'snacks'];
        
        days.forEach(day => {
            times.forEach(time => {
                const meal = weekMeals[day] && weekMeals[day][time];
                if (meal && meal.id) {
                    mealsArray.push({
                        day: day,
                        time: time,
                        recipe_id: meal.id
                    });
                }
            });
        });
        
        const response = await fetch(API_SAVE_MEAL_PLAN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                week_start: weekStartDate,
                meals: mealsArray
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error saving meal plan:', data.message);
            // Fallback to localStorage
            try {
                localStorage.setItem('mealplanner_plan', JSON.stringify(mealPlan));
            } catch (error) {
                console.error('Error saving meal plan to localStorage:', error);
            }
        }
    } catch (error) {
        console.error('Error saving meal plan:', error);
        // Fallback to localStorage
        try {
            localStorage.setItem('mealplanner_plan', JSON.stringify(mealPlan));
        } catch (error) {
            console.error('Error saving meal plan to localStorage:', error);
        }
    }
}

// Load meal plan from database
async function loadMealPlanFromDB() {
    if (!isLoggedIn) {
        // Fallback to localStorage if not logged in
        try {
            const saved = localStorage.getItem('mealplanner_plan');
            mealPlan = saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading meal plan from localStorage:', error);
            mealPlan = {};
        }
        return;
    }
    
    try {
        const weekKey = getWeekKey(currentWeekStart);
        const weekStartDate = formatDateForDB(currentWeekStart);
        
        const response = await fetch(`${API_GET_MEAL_PLAN}?week_start=${encodeURIComponent(weekStartDate)}`);
        const data = await response.json();
        
        if (data.success && data.meals) {
            // Convert database format to mealPlan format
            mealPlan[weekKey] = data.meals;
        } else {
            mealPlan[weekKey] = {};
        }
    } catch (error) {
        console.error('Error loading meal plan:', error);
        // Fallback to localStorage
        try {
            const saved = localStorage.getItem('mealplanner_plan');
            mealPlan = saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading meal plan from localStorage:', error);
            mealPlan = {};
        }
    }
}

// Format date for database (YYYY-MM-DD)
function formatDateForDB(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Show auto-save notification
function showAutoSave() {
    if (!autoSaveNotification) return;
    
    autoSaveNotification.classList.add('show');
    
    setTimeout(() => {
        autoSaveNotification.classList.remove('show');
    }, 2000);
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

// Set active navigation link
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav a[data-page]');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (currentPage === 'meal-planner.html' && link.dataset.page === 'planner') {
            link.classList.add('active');
        }
    });
}

// Export meal plan data for shopping list
function getMealPlanData() {
    const weekKey = getWeekKey(currentWeekStart);
    return mealPlan[weekKey] || {};
}

// Make getMealPlanData available globally
window.getMealPlanData = getMealPlanData;

