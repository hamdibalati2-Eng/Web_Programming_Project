// Shopping List JavaScript

const API_RECIPE = 'api/get_recipe.php';
const API_GET_MEAL_PLAN = 'api/get_meal_plan.php';
const API_GENERATE_SHOPPING_LIST = 'api/generate_shopping_list.php';
const API_GET_SHOPPING_LIST = 'api/get_shopping_list.php';
const API_UPDATE_SHOPPING_ITEM = 'api/update_shopping_item.php';
let shoppingList = {};
let checkedItems = loadCheckedItems();
let isLoggedIn = false;

// UI Elements
const emptyState = document.getElementById('emptyState');
const shoppingContent = document.getElementById('shoppingContent');
const shoppingCategories = document.getElementById('shoppingCategories');
const mealCount = document.getElementById('mealCount');
const ingredientCount = document.getElementById('ingredientCount');
const printBtn = document.getElementById('printBtn');
const clearListBtn = document.getElementById('clearListBtn');
const checkAllBtn = document.getElementById('checkAllBtn');
const uncheckAllBtn = document.getElementById('uncheckAllBtn');
const generateListBtn = document.getElementById('generateListBtn');

// Category icons mapping
const categoryIcons = {
    'Produce': 'fas fa-carrot',
    'Meat': 'fas fa-drumstick-bite',
    'Dairy': 'fas fa-cheese',
    'Pantry': 'fas fa-box',
    'Bakery': 'fas fa-bread-slice',
    'Frozen': 'fas fa-snowflake',
    'Beverages': 'fas fa-glass',
    'Other': 'fas fa-shopping-basket'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initMobileMenu();
    initHeaderScroll();
    setActiveNavLink();
    initEventListeners();
    await checkAuthStatus();
    // Only load existing shopping list, don't auto-generate
    await loadShoppingList();
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const response = await fetch('api/check_auth.php');
        const data = await response.json();
        isLoggedIn = data.authenticated || localStorage.getItem('is_logged_in') === 'true';
    } catch (error) {
        console.error('Auth check error:', error);
        isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
    }
}

// Initialize Event Listeners
function initEventListeners() {
    printBtn?.addEventListener('click', () => {
        window.print();
    });

    clearListBtn?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear the entire shopping list?')) {
            // Clear the shopping list
            shoppingList = {};
            checkedItems = {};
            saveCheckedItems();
            
            // Clear from UI
            if (shoppingCategories) shoppingCategories.innerHTML = '';
            
            // Reset counts
            if (mealCount) mealCount.textContent = '0 meals';
            if (ingredientCount) ingredientCount.textContent = '0 items';
            
            // Show empty state
            showEmptyState();
        }
    });

    checkAllBtn?.addEventListener('click', () => {
        const allCheckboxes = document.querySelectorAll('.ingredient-item');
        allCheckboxes.forEach(item => {
            const ingredientKey = item.dataset.ingredientKey;
            if (ingredientKey) {
                checkedItems[ingredientKey] = true;
            }
            item.classList.add('checked');
            item.querySelector('.ingredient-checkbox i').style.display = 'block';
        });
        saveCheckedItems();
    });

    uncheckAllBtn?.addEventListener('click', () => {
        const allCheckboxes = document.querySelectorAll('.ingredient-item');
        allCheckboxes.forEach(item => {
            const ingredientKey = item.dataset.ingredientKey;
            if (ingredientKey) {
                delete checkedItems[ingredientKey];
            }
            item.classList.remove('checked');
            item.querySelector('.ingredient-checkbox i').style.display = 'none';
        });
        saveCheckedItems();
    });
    
    // Generate shopping list button (in empty state)
    generateListBtn?.addEventListener('click', generateShoppingList);
}

// Load existing shopping list (called on page load)
async function loadShoppingList() {
    if (isLoggedIn) {
        // For logged-in users, load from database only (don't generate)
        await loadShoppingListFromDB();
    } else {
        // For non-logged-in users, show empty state (they need to click generate)
        showEmptyState();
    }
}

// Load existing shopping list from database (without regenerating)
async function loadShoppingListFromDB() {
    try {
        const currentWeekStart = getWeekStart(new Date());
        const weekStartDate = formatDateForDB(currentWeekStart);
        
        // Fetch the existing shopping list from database
        const listResponse = await fetch(`${API_GET_SHOPPING_LIST}?week_start=${encodeURIComponent(weekStartDate)}`);
        const listData = await listResponse.json();
        
        if (!listData.success || !listData.shopping_list || Object.keys(listData.shopping_list).length === 0) {
            showEmptyState();
            return;
        }
        
        // Use the database shopping list
        shoppingList = listData.shopping_list;
        
        // Count meals from meal plan
        const mealResponse = await fetch(`${API_GET_MEAL_PLAN}?week_start=${encodeURIComponent(weekStartDate)}`);
        const mealData = await mealResponse.json();
        let mealTotal = 0;
        if (mealData.success && mealData.meals) {
            Object.values(mealData.meals).forEach(day => {
                Object.values(day).forEach(meal => {
                    if (meal && (meal.id || meal.recipe_id)) mealTotal++;
                });
            });
        }
        
        // Update counts
        if (mealCount) {
            mealCount.textContent = `${mealTotal} ${mealTotal === 1 ? 'meal' : 'meals'}`;
        }
        if (ingredientCount) {
            const count = listData.total_items || 0;
            ingredientCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
        }
        
        // Render shopping list from database
        renderShoppingListFromDB();
        showShoppingContent();
        
    } catch (error) {
        console.error('Error loading shopping list from DB:', error);
        showEmptyState();
    }
}

// Generate shopping list (called when user clicks Generate button)
async function generateShoppingList() {
    if (isLoggedIn) {
        await generateShoppingListFromDB();
    } else {
        await generateShoppingListFromLocalStorage();
    }
}

// Generate shopping list from database (for logged-in users)
async function generateShoppingListFromDB() {
    try {
        const currentWeekStart = getWeekStart(new Date());
        const weekStartDate = formatDateForDB(currentWeekStart);
        
        // Show loading state on button
        if (generateListBtn) {
            generateListBtn.disabled = true;
            generateListBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }
        
        // Call the generate API to extract ingredients from meal plan and save to database
        const generateResponse = await fetch(API_GENERATE_SHOPPING_LIST, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week_start: weekStartDate })
        });
        const generateData = await generateResponse.json();
        
        if (!generateData.success) {
            alert(generateData.message || 'No meals found for this week. Please add some meals first.');
            resetGenerateButton();
            showEmptyState();
            return;
        }
        
        // Update meal count
        if (mealCount) {
            const count = generateData.meal_count || 0;
            mealCount.textContent = `${count} ${count === 1 ? 'meal' : 'meals'}`;
        }
        
        // Now fetch the shopping list from database
        const listResponse = await fetch(`${API_GET_SHOPPING_LIST}?week_start=${encodeURIComponent(weekStartDate)}`);
        const listData = await listResponse.json();
        
        if (!listData.success || !listData.shopping_list || Object.keys(listData.shopping_list).length === 0) {
            resetGenerateButton();
            showEmptyState();
            return;
        }
        
        // Use the database shopping list
        shoppingList = listData.shopping_list;
        
        // Update ingredient count
        if (ingredientCount) {
            const count = listData.total_items || 0;
            ingredientCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
        }
        
        // Render shopping list from database
        renderShoppingListFromDB();
        showShoppingContent();
        resetGenerateButton();
        
    } catch (error) {
        console.error('Error generating shopping list from DB:', error);
        alert('Error generating shopping list. Please try again.');
        resetGenerateButton();
        showEmptyState();
    }
}

// Reset generate button to default state
function resetGenerateButton() {
    if (generateListBtn) {
        generateListBtn.disabled = false;
        generateListBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Shopping List';
    }
}

// Generate shopping list from localStorage (for non-logged-in users)
async function generateShoppingListFromLocalStorage() {
    try {
        const currentWeekStart = getWeekStart(new Date());
        const weekKey = getWeekKey(currentWeekStart);
        
        const mealPlanData = localStorage.getItem('mealplanner_plan');
        if (!mealPlanData) {
            showEmptyState();
            return;
        }
        
        const mealPlan = JSON.parse(mealPlanData);
        const weekMeals = mealPlan[weekKey] || {};

        // Count meals and collect IDs
        let totalMeals = 0;
        const recipeIds = new Set();

        Object.values(weekMeals).forEach(day => {
            Object.values(day).forEach(meal => {
                if (meal && (meal.id || meal.recipe_id)) {
                    totalMeals++;
                    recipeIds.add(meal.id || meal.recipe_id);
                }
            });
        });

        if (totalMeals === 0) {
            showEmptyState();
            return;
        }

        // Update meal count display
        if (mealCount) {
            mealCount.textContent = `${totalMeals} ${totalMeals === 1 ? 'meal' : 'meals'}`;
        }

        // Fetch all recipe details with ingredients
        const recipes = await Promise.all(
            Array.from(recipeIds).map(id => fetchRecipe(id))
        );

        // Collect and aggregate ingredients
        const ingredientsMap = new Map();

        recipes.forEach(recipe => {
            if (recipe && recipe.ingredients) {
                recipe.ingredients.forEach(ing => {
                    const name = ing.ingredient?.trim();
                    if (!name) return;

                    const key = name.toLowerCase();
                    if (ingredientsMap.has(key)) {
                        const existing = ingredientsMap.get(key);
                        if (ing.measure && existing.measure) {
                            existing.measure = combineMeasures(existing.measure, ing.measure);
                        } else if (ing.measure) {
                            existing.measure = ing.measure;
                        }
                    } else {
                        ingredientsMap.set(key, {
                            name: name,
                            measure: ing.measure || ''
                        });
                    }
                });
            }
        });

        // Group into categories
        const ingredientsArray = Array.from(ingredientsMap.values());
        shoppingList = groupIngredientsByCategory(ingredientsArray);

        // Update ingredient count display
        if (ingredientCount) {
            const totalIngredients = ingredientsArray.length;
            ingredientCount.textContent = `${totalIngredients} ${totalIngredients === 1 ? 'item' : 'items'}`;
        }

        renderShoppingList();
        showShoppingContent();

    } catch (error) {
        console.error('Error generating shopping list:', error);
        showEmptyState();
    }
}

// Fetch recipe by ID
async function fetchRecipe(id) {
    try {
        const response = await fetch(`${API_RECIPE}?id=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Recipe fetch failed');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching recipe ${id}:`, error);
        return null;
    }
}

// Simple combine measures
function combineMeasures(m1, m2) {
    if (m1 === m2) return m1;
    if (!m1) return m2;
    if (!m2) return m1;
    return `${m1}, ${m2}`;
}

// Group ingredients by category using keywords
function groupIngredientsByCategory(ingredients) {
    const categories = {
        'Produce': [],
        'Meat': [],
        'Dairy': [],
        'Pantry': [],
        'Bakery': [],
        'Frozen': [],
        'Beverages': [],
        'Other': []
    };

    const keywords = {
        Produce: ['vegetable', 'fruit', 'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'potato', 'apple', 'banana', 'orange', 'lemon', 'lime', 'herb', 'spinach', 'broccoli', 'cucumber', 'celery', 'mushroom', 'parsley', 'cilantro', 'ginger'],
        Meat: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'sausage', 'meat', 'fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'steak', 'fillet'],
        Dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'egg', 'eggs', 'parmesan', 'mozzarella'],
        Bakery: ['bread', 'roll', 'bun', 'bagel', 'croissant', 'tortilla', 'pita'],
        Frozen: ['frozen', 'ice cream', 'sorbet'],
        Beverages: ['juice', 'water', 'soda', 'wine', 'beer', 'tea', 'coffee', 'coke'],
        Pantry: ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'spice', 'rice', 'pasta', 'noodle', 'bean', 'lentil', 'canned', 'sauce', 'stock', 'broth', 'honey', 'syrup', 'nuts', 'seeds', 'cereal']
    };

    ingredients.forEach(ing => {
        const name = ing.name.toLowerCase();
        let categorized = false;

        for (const [cat, kws] of Object.entries(keywords)) {
            if (kws.some(kw => name.includes(kw))) {
                categories[cat].push(ing);
                categorized = true;
                break;
            }
        }

        if (!categorized) categories.Other.push(ing);
    });

    // Clean empty categories
    return Object.fromEntries(Object.entries(categories).filter(([_, items]) => items.length > 0));
}

// Render the list (for localStorage-based list)
function renderShoppingList() {
    if (!shoppingCategories) return;
    shoppingCategories.innerHTML = '';

    Object.keys(shoppingList).sort().forEach(category => {
        const section = document.createElement('div');
        section.className = 'shopping-category';
        const icon = categoryIcons[category] || categoryIcons.Other;

        section.innerHTML = `
            <div class="category-header">
                <i class="${icon}"></i>
                <h2>${category}</h2>
                <span class="category-count">${shoppingList[category].length}</span>
            </div>
            <div class="ingredients-list"></div>
        `;

        const list = section.querySelector('.ingredients-list');
        shoppingList[category].forEach(ing => {
            const key = `shop-${ing.name.toLowerCase().replace(/\s+/g, '-')}`;
            const isChecked = checkedItems[key] || false;

            const item = document.createElement('div');
            item.className = `ingredient-item ${isChecked ? 'checked' : ''}`;
            item.dataset.ingredientKey = key;
            item.innerHTML = `
                <div class="ingredient-checkbox"><i class="fas fa-check" style="${isChecked ? 'display:block' : ''}"></i></div>
                <span class="ingredient-name">${ing.name}</span>
                <span class="ingredient-measure ${ing.measure ? '' : 'empty'}">${ing.measure || ''}</span>
            `;

            item.addEventListener('click', () => {
                if (checkedItems[key]) {
                    delete checkedItems[key];
                    item.classList.remove('checked');
                    item.querySelector('i').style.display = 'none';
                } else {
                    checkedItems[key] = true;
                    item.classList.add('checked');
                    item.querySelector('i').style.display = 'block';
                }
                saveCheckedItems();
            });
            list.appendChild(item);
        });
        shoppingCategories.appendChild(section);
    });
}

// Render shopping list from database
function renderShoppingListFromDB() {
    if (!shoppingCategories) return;
    shoppingCategories.innerHTML = '';

    Object.keys(shoppingList).sort().forEach(category => {
        const section = document.createElement('div');
        section.className = 'shopping-category';
        const icon = categoryIcons[category] || categoryIcons.Other;

        section.innerHTML = `
            <div class="category-header">
                <i class="${icon}"></i>
                <h2>${category}</h2>
                <span class="category-count">${shoppingList[category].length}</span>
            </div>
            <div class="ingredients-list"></div>
        `;

        const ingredientsList = section.querySelector('.ingredients-list');

        shoppingList[category].forEach(ing => {
            const isChecked = ing.is_checked || false;

            const item = document.createElement('div');
            item.className = `ingredient-item ${isChecked ? 'checked' : ''}`;
            item.dataset.itemId = ing.id;
            item.dataset.checked = isChecked ? 'true' : 'false';

            item.innerHTML = `
                <div class="ingredient-checkbox">
                    <i class="fas fa-check" style="${isChecked ? 'display:block' : ''}"></i>
                </div>
                <span class="ingredient-name">${ing.name}</span>
                <span class="ingredient-measure ${ing.measure ? '' : 'empty'}">${ing.measure || ''}</span>
            `;

            item.addEventListener('click', () => {
                const currentChecked = item.dataset.checked === 'true';
                toggleIngredientDB(ing.id, item, !currentChecked);
            });

            ingredientsList.appendChild(item);
        });

        shoppingCategories.appendChild(section);
    });
}

// Toggle ingredient checked state in database
async function toggleIngredientDB(itemId, element, newCheckedState) {
    try {
        const response = await fetch(API_UPDATE_SHOPPING_ITEM, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_id: itemId,
                is_checked: newCheckedState ? 1 : 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update the data attribute to track current state
            element.dataset.checked = newCheckedState ? 'true' : 'false';
            
            if (newCheckedState) {
                element.classList.add('checked');
                element.querySelector('.ingredient-checkbox i').style.display = 'block';
            } else {
                element.classList.remove('checked');
                element.querySelector('.ingredient-checkbox i').style.display = 'none';
            }
        } else {
            console.error('Failed to update item:', data.message);
        }
    } catch (error) {
        console.error('Error updating shopping item:', error);
    }
}

// Date helpers matching meal-planner.js
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekKey(date) {
    const ws = getWeekStart(date);
    return `${ws.getFullYear()}-W${getWeekNumber(ws)}`;
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatDateForDB(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Show/hide UI states
function showEmptyState() {
    if (emptyState) emptyState.style.display = 'block';
    if (shoppingContent) shoppingContent.style.display = 'none';
}

function showShoppingContent() {
    if (emptyState) emptyState.style.display = 'none';
    if (shoppingContent) shoppingContent.style.display = 'block';
}

// Storage helpers
function saveCheckedItems() { localStorage.setItem('shopping_list_checked', JSON.stringify(checkedItems)); }
function loadCheckedItems() {
    try { return JSON.parse(localStorage.getItem('shopping_list_checked')) || {}; }
    catch { return {}; }
}

// Shared UI Shared helpers (Mobile Menu & Scroll)
function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    if (toggle && nav) {
        toggle.onclick = () => { toggle.classList.toggle('active'); nav.classList.toggle('active'); };
        nav.onclick = (e) => { if (e.target.tagName === 'A') { toggle.classList.remove('active'); nav.classList.remove('active'); } };
    }
}

function initHeaderScroll() {
    const header = document.querySelector('header');
    window.onscroll = () => { if (window.pageYOffset > 50) header?.classList.add('scrolled'); else header?.classList.remove('scrolled'); };
}

function setActiveNavLink() {
    document.querySelectorAll('.main-nav a[data-page]').forEach(link => {
        link.classList.toggle('active', link.dataset.page === 'shopping');
    });
}
