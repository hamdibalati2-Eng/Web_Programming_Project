// Admin Panel JavaScript

let currentTab = 'users';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    initTabs();
    loadData('users');
});

// Check admin access
async function checkAdminAccess() {
    try {
        const response = await fetch('api/admin/check_admin.php');
        const data = await response.json();
        
        if (!data.is_admin) {
            alert('Admin access required. Redirecting...');
            window.location.href = 'index.html';
            return;
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
        alert('Error checking admin access');
        window.location.href = 'index.html';
    }
}

// Initialize tabs
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active states
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            currentTab = tabName;
            loadData(tabName);
        });
    });
}

// Load data for current tab
async function loadData(type) {
    try {
        const response = await fetch(`api/admin/get_all.php?type=${type}`);
        const data = await response.json();
        
        if (data.success) {
            renderTable(type, data.data);
        } else {
            console.error('Error loading data:', data.message);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Render table
function renderTable(type, items) {
    const tableBody = document.getElementById(`${type.replace('-', '')}TableBody`);
    if (!tableBody) return;
    
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #64748b;">No data found</td></tr>';
        return;
    }
    
    let html = '';
    
    switch (type) {
        case 'users':
            items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.email}</td>
                        <td>${item.first_name || ''} ${item.last_name || ''}</td>
                        <td>${item.is_admin == 1 ? '<span class="badge-admin">Admin</span>' : '<span class="badge-user">User</span>'}</td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editUser(${item.id})">Edit</button>
                            <button class="btn-action btn-delete" onclick="deleteItem('users', ${item.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            break;
            
        case 'recipes':
            items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.category || '-'}</td>
                        <td>${item.area || '-'}</td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editRecipe('${item.id}')">Edit</button>
                            <button class="btn-action btn-delete" onclick="deleteItem('recipes', '${item.id}')">Delete</button>
                        </td>
                    </tr>
                `;
            });
            break;
            
        case 'reviews':
            items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.user_email}</td>
                        <td>${item.recipe_name}</td>
                        <td>${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</td>
                        <td>${(item.comment || '').substring(0, 50)}${item.comment && item.comment.length > 50 ? '...' : ''}</td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-action btn-delete" onclick="deleteItem('reviews', ${item.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            break;
            
        case 'meal-plans':
            items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.user_email}</td>
                        <td>${item.week_start}</td>
                        <td>${item.day_of_week}</td>
                        <td>${item.meal_time}</td>
                        <td>${item.recipe_name}</td>
                        <td>
                            <button class="btn-action btn-delete" onclick="deleteItem('meal_plans', ${item.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            break;
            
        case 'ingredients':
            items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.recipe_id}</td>
                        <td>${item.ingredient}</td>
                        <td>${item.measure || '-'}</td>
                        <td>
                            <button class="btn-action btn-edit" onclick="editIngredient(${item.id})">Edit</button>
                            <button class="btn-action btn-delete" onclick="deleteItem('ingredients', ${item.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            break;
            
        case 'favorites':
            items.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id}</td>
                        <td>${item.user_email}</td>
                        <td>${item.recipe_name}</td>
                        <td>${new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-action btn-delete" onclick="deleteItem('favorites', ${item.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
            break;
    }
    
    tableBody.innerHTML = html;
}

// Delete item
async function deleteItem(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) {
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('id', id);
        
        const response = await fetch('api/admin/delete.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Item deleted successfully');
            loadData(currentTab);
        } else {
            alert(data.message || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('An error occurred. Please try again.');
    }
}

// Make functions available globally
window.deleteItem = deleteItem;
window.editUser = function(id) { alert('Edit user functionality - to be implemented'); };
window.editRecipe = function(id) { alert('Edit recipe functionality - to be implemented'); };
window.editIngredient = function(id) { alert('Edit ingredient functionality - to be implemented'); };
window.showAddUserModal = function() { alert('Add user functionality - to be implemented'); };
window.showAddRecipeModal = function() { alert('Add recipe functionality - to be implemented'); };
window.showAddIngredientModal = function() { alert('Add ingredient functionality - to be implemented'); };

