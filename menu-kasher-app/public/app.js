// Configuration de l'API
const API_BASE = window.location.origin;

// État global de l'application
let currentUser = { id: null, name: 'Famille Kasher' };
let currentMenus = [];
let currentRecipes = [];
let currentShoppingLists = [];
let currentIngredients = [];

// Utilitaires
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatMealType = (mealType) => {
    const types = {
        'lunch_children': 'Déjeuner Enfants',
        'dinner_children': 'Dîner Enfants',
        'dinner_adults': 'Dîner Adultes'
    };
    return types[mealType] || mealType;
};

const showAlert = (message, type = 'info') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
};

// API Calls
const api = {
    async get(endpoint) {
        const response = await fetch(`${API_BASE}/api${endpoint}`);
        if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);
        return response.json();
    },

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE}/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);
        return response.json();
    },

    async put(endpoint, data) {
        const response = await fetch(`${API_BASE}/api${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);
        return response.json();
    },

    async delete(endpoint) {
        const response = await fetch(`${API_BASE}/api${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);
        return response.ok;
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🏠 Initialisation de l'application Menu Kasher");
    
    try {
        // Utiliser un utilisateur par défaut (famille kasher)
        currentUser = { 
            id: 'famille-kasher', 
            name: 'Famille Kasher',
            email: 'famille@menu-kasher.app'
        };
        
        // Charger les données initiales
        await loadMenus();
        
        // Configurer les événements de navigation
        setupNavigation();
        
        console.log('✅ Application initialisée');
    } catch (error) {
        console.error("❌ Erreur d'initialisation:", error);
        showAlert('Erreur de connexion au serveur', 'danger');
    }
});

// Navigation
function setupNavigation() {
    const navTabs = document.querySelectorAll('[data-bs-toggle="pill"]');
    navTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', async (event) => {
            const target = event.target.getAttribute('data-bs-target');
            await loadTabContent(target);
        });
    });
}

async function loadTabContent(target) {
    try {
        switch (target) {
            case '#menus':
                await loadMenus();
                break;
            case '#recipes':
                await loadRecipes();
                break;
            case '#shopping':
                await loadShoppingLists();
                break;
            case '#ingredients':
                await loadIngredients();
                break;
        }
    } catch (error) {
        console.error('Erreur de chargement:', error);
        showAlert('Erreur lors du chargement des données', 'danger');
    }
}

// Gestion des Menus
async function loadMenus() {
    const container = document.getElementById('menus-list');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3">Chargement des menus...</p>
        </div>
    `;

    try {
        currentMenus = await api.get('/menus');
        displayMenus();
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors du chargement des menus
            </div>
        `;
    }
}

function displayMenus() {
    const container = document.getElementById('menus-list');
    
    if (currentMenus.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-x display-1 text-muted mb-3"></i>
                <h3>Aucun menu trouvé</h3>
                <p class="text-muted">Créez votre premier menu pour commencer</p>
                <button class="btn btn-primary" onclick="createNewMenu()">
                    <i class="bi bi-plus-lg me-1"></i> Créer un Menu
                </button>
            </div>
        `;
        return;
    }

    const menusHtml = currentMenus.map(menu => `
        <div class="col-md-6 col-lg-4 mb-4 fade-in">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${menu.name}</h5>
                    ${menu.isActive ? '<span class="badge bg-success">Actif</span>' : ''}
                </div>
                <div class="card-body">
                    <p class="text-muted">
                        <i class="bi bi-calendar3 me-1"></i>
                        Du ${formatDate(menu.startDate)} au ${formatDate(menu.endDate)}
                    </p>
                    <div class="row text-center">
                        <div class="col-4">
                            <div class="h4 mb-0 text-primary">${menu._count.meals}</div>
                            <small class="text-muted">Repas</small>
                        </div>
                        <div class="col-4">
                            <div class="h4 mb-0 text-success">${menu._count.shoppingLists}</div>
                            <small class="text-muted">Listes</small>
                        </div>
                        <div class="col-4">
                            <div class="h4 mb-0 text-info">${Math.ceil((new Date(menu.endDate) - new Date(menu.startDate)) / (1000 * 60 * 60 * 24))}</div>
                            <small class="text-muted">Jours</small>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-primary" onclick="viewMenu('${menu.id}')">
                            <i class="bi bi-eye me-1"></i> Voir
                        </button>
                        <button class="btn btn-outline-success" onclick="generateMenuMeals('${menu.id}')">
                            <i class="bi bi-magic me-1"></i> Générer
                        </button>
                        <button class="btn btn-outline-info" onclick="duplicateMenu('${menu.id}')">
                            <i class="bi bi-files me-1"></i> Dupliquer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="row">${menusHtml}</div>`;
}

async function createNewMenu() {
    const name = prompt('Nom du nouveau menu:', `Menu ${new Date().toLocaleDateString('fr-FR')}`);
    if (!name) return;

    const startDate = prompt('Date de début (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!startDate) return;

    try {
        const newMenu = await api.post('/menus', {
            name,
            startDate,
            userId: currentUser.id || 'default-user-id'
        });
        
        showAlert('Menu créé avec succès!', 'success');
        await loadMenus();
    } catch (error) {
        showAlert('Erreur lors de la création du menu', 'danger');
    }
}

async function viewMenu(menuId) {
    try {
        const menu = await api.get(`/menus/${menuId}`);
        showMenuDetails(menu);
    } catch (error) {
        showAlert('Erreur lors du chargement du menu', 'danger');
    }
}

function showMenuDetails(menu) {
    const modalBody = document.getElementById('menuModalBody');
    
    // Organiser les repas par jour
    const mealsByDay = {};
    menu.meals.forEach(meal => {
        const dateKey = new Date(meal.date).toDateString();
        if (!mealsByDay[dateKey]) {
            mealsByDay[dateKey] = {};
        }
        mealsByDay[dateKey][meal.mealType] = meal;
    });

    const daysHtml = Object.keys(mealsByDay).sort().map(dateKey => {
        const date = new Date(dateKey);
        const dayMeals = mealsByDay[dateKey];
        
        return `
            <div class="day-card card mb-3">
                <div class="day-header card-header">
                    <h6 class="mb-0">${formatDate(date)}</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${Object.entries(dayMeals).map(([mealType, meal]) => `
                            <div class="col-md-4 mb-3">
                                <div class="meal-card">
                                    <div class="meal-type ${mealType}">${formatMealType(mealType)}</div>
                                    ${meal.recipe ? `
                                        <div class="recipe-name">${meal.recipe.name}</div>
                                        <div class="recipe-description">${meal.recipe.description || ''}</div>
                                        <div class="recipe-meta">
                                            ${meal.recipe.prepTime ? `<span><i class="bi bi-clock"></i> ${meal.recipe.prepTime}min</span>` : ''}
                                            ${meal.recipe.servings ? `<span><i class="bi bi-people"></i> ${meal.recipe.servings}p</span>` : ''}
                                        </div>
                                    ` : `
                                        <div class="text-muted">Aucune recette assignée</div>
                                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="assignRecipe('${meal.id}')">
                                            Assigner une recette
                                        </button>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    modalBody.innerHTML = `
        <div class="mb-3">
            <h4>${menu.name}</h4>
            <p class="text-muted">Du ${formatDate(menu.startDate)} au ${formatDate(menu.endDate)}</p>
        </div>
        <div class="menu-calendar">
            ${daysHtml}
        </div>
        <div class="mt-4">
            <button class="btn btn-success me-2" onclick="generateShoppingListFromMenu('${menu.id}')">
                <i class="bi bi-basket me-1"></i> Générer Liste de Courses
            </button>
            <button class="btn btn-info" onclick="exportMenu('${menu.id}')">
                <i class="bi bi-download me-1"></i> Exporter Menu
            </button>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('menuModal'));
    modal.show();
}

async function generateMenuMeals(menuId) {
    try {
        showAlert('Génération du menu en cours...', 'info');
        const updatedMenu = await api.post(`/menus/${menuId}/generate`, {
            preferences: ['pas_de_tofu']
        });
        showAlert('Menu généré avec succès!', 'success');
        await loadMenus();
    } catch (error) {
        showAlert('Erreur lors de la génération du menu', 'danger');
    }
}

// Gestion des Recettes
async function loadRecipes() {
    const container = document.getElementById('recipes-list');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3">Chargement des recettes...</p>
        </div>
    `;

    try {
        currentRecipes = await api.get('/recipes');
        displayRecipes();
        setupRecipeFilters();
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors du chargement des recettes
            </div>
        `;
    }
}

function displayRecipes(recipes = currentRecipes) {
    const container = document.getElementById('recipes-list');
    
    if (recipes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-book display-1 text-muted mb-3"></i>
                <h3>Aucune recette trouvée</h3>
                <p class="text-muted">Ajoutez votre première recette kasher</p>
                <button class="btn btn-primary" onclick="createNewRecipe()">
                    <i class="bi bi-plus-lg me-1"></i> Nouvelle Recette
                </button>
            </div>
        `;
        return;
    }

    const recipesHtml = recipes.map(recipe => `
        <div class="col-md-6 col-lg-4 mb-4 fade-in">
            <div class="card h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${recipe.name}</h5>
                        <span class="badge bg-secondary">${formatMealType(recipe.mealType)}</span>
                    </div>
                    <p class="card-text text-muted flex-grow-1">${recipe.description || 'Aucune description'}</p>
                    <div class="recipe-meta mb-3">
                        ${recipe.prepTime ? `<span><i class="bi bi-clock"></i> ${recipe.prepTime}min</span>` : ''}
                        ${recipe.cookTime ? `<span><i class="bi bi-fire"></i> ${recipe.cookTime}min</span>` : ''}
                        <span><i class="bi bi-people"></i> ${recipe.servings}p</span>
                        <span><i class="bi bi-star"></i> ${recipe.difficulty}</span>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-primary btn-sm flex-grow-1" onclick="viewRecipe('${recipe.id}')">
                            <i class="bi bi-eye me-1"></i> Voir
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="editRecipe('${recipe.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                </div>
                ${recipe._count.meals > 0 ? `
                    <div class="card-footer bg-transparent">
                        <small class="text-muted">
                            <i class="bi bi-calendar-check me-1"></i>
                            Utilisée ${recipe._count.meals} fois
                        </small>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="row">${recipesHtml}</div>`;
}

function setupRecipeFilters() {
    const searchInput = document.getElementById('recipe-search');
    const filterSelect = document.getElementById('recipe-filter');

    const filterRecipes = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const mealTypeFilter = filterSelect.value;

        const filtered = currentRecipes.filter(recipe => {
            const matchesSearch = !searchTerm || 
                recipe.name.toLowerCase().includes(searchTerm) ||
                (recipe.description && recipe.description.toLowerCase().includes(searchTerm));
            
            const matchesMealType = !mealTypeFilter || recipe.mealType === mealTypeFilter;
            
            return matchesSearch && matchesMealType;
        });

        displayRecipes(filtered);
    };

    searchInput.addEventListener('input', filterRecipes);
    filterSelect.addEventListener('change', filterRecipes);
}

async function viewRecipe(recipeId) {
    try {
        const recipe = await api.get(`/recipes/${recipeId}`);
        showRecipeDetails(recipe);
    } catch (error) {
        showAlert('Erreur lors du chargement de la recette', 'danger');
    }
}

function showRecipeDetails(recipe) {
    const modalBody = document.getElementById('recipeModalBody');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h4>${recipe.name}</h4>
                <p class="text-muted">${recipe.description || 'Aucune description'}</p>
                
                <div class="row mb-4">
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h5 mb-0 text-primary">${recipe.servings}</div>
                            <small class="text-muted">Portions</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h5 mb-0 text-success">${recipe.prepTime || '?'}</div>
                            <small class="text-muted">Préparation (min)</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h5 mb-0 text-warning">${recipe.cookTime || '?'}</div>
                            <small class="text-muted">Cuisson (min)</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h5 mb-0 text-info">${recipe.difficulty}</div>
                            <small class="text-muted">Difficulté</small>
                        </div>
                    </div>
                </div>

                <h5>Instructions</h5>
                <ol class="mb-4">
                    ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ol>

                ${recipe.tips.length > 0 ? `
                    <h5>Conseils</h5>
                    <ul class="mb-4">
                        ${recipe.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                ` : ''}

                ${recipe.suggestedDrink ? `
                    <div class="alert alert-info">
                        <i class="bi bi-cup me-2"></i>
                        <strong>Suggestion de boisson:</strong> ${recipe.suggestedDrink}
                    </div>
                ` : ''}
            </div>
            
            <div class="col-md-4">
                <h5>Ingrédients</h5>
                <div class="list-group list-group-flush">
                    ${recipe.ingredients.map(ing => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>${ing.ingredient.name}</strong>
                                ${ing.notes ? `<br><small class="text-muted">${ing.notes}</small>` : ''}
                            </div>
                            <span class="badge bg-primary rounded-pill">
                                ${ing.quantity}${ing.unit || ing.ingredient.unit}
                            </span>
                        </div>
                    `).join('')}
                </div>

                ${recipe.equipment && recipe.equipment.length > 0 ? `
                    <h6 class="mt-4">Équipement nécessaire</h6>
                    <div class="d-flex flex-wrap gap-1">
                        ${recipe.equipment.map(item => `
                            <span class="badge bg-secondary">${item}</span>
                        `).join('')}
                    </div>
                ` : ''}

                ${recipe.tags.length > 0 ? `
                    <h6 class="mt-3">Tags</h6>
                    <div class="d-flex flex-wrap gap-1">
                        ${recipe.tags.map(tag => `
                            <span class="badge bg-outline-primary">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
    modal.show();
}

// Gestion des Listes de Courses
async function loadShoppingLists() {
    const container = document.getElementById('shopping-lists');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3">Chargement des listes de courses...</p>
        </div>
    `;

    try {
        currentShoppingLists = await api.get('/shopping-lists');
        displayShoppingLists();
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors du chargement des listes de courses
            </div>
        `;
    }
}

function displayShoppingLists() {
    const container = document.getElementById('shopping-lists');
    
    if (currentShoppingLists.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-basket display-1 text-muted mb-3"></i>
                <h3>Aucune liste de courses</h3>
                <p class="text-muted">Générez votre première liste à partir d'un menu</p>
                <button class="btn btn-success" onclick="generateShoppingList()">
                    <i class="bi bi-magic me-1"></i> Générer Liste
                </button>
            </div>
        `;
        return;
    }

    const listsHtml = currentShoppingLists.map(list => `
        <div class="col-md-6 col-lg-4 mb-4 fade-in">
            <div class="card h-100">
                <div class="card-header">
                    <h5 class="mb-0">${list.name}</h5>
                    <small class="text-muted">Menu: ${list.menu.name}</small>
                </div>
                <div class="card-body">
                    <div class="row text-center mb-3">
                        <div class="col-6">
                            <div class="h4 mb-0 text-primary">${list._count.items}</div>
                            <small class="text-muted">Articles</small>
                        </div>
                        <div class="col-6">
                            <div class="h4 mb-0 text-success">${list.items.filter(item => item.isPurchased).length}</div>
                            <small class="text-muted">Achetés</small>
                        </div>
                    </div>
                    
                    <div class="progress mb-3">
                        <div class="progress-bar" style="width: ${list._count.items > 0 ? (list.items.filter(item => item.isPurchased).length / list._count.items) * 100 : 0}%"></div>
                    </div>
                    
                    <small class="text-muted">
                        <i class="bi bi-calendar3 me-1"></i>
                        Créée le ${formatDate(list.createdAt)}
                    </small>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-primary" onclick="viewShoppingList('${list.id}')">
                            <i class="bi bi-eye me-1"></i> Voir
                        </button>
                        <button class="btn btn-outline-success" onclick="printShoppingList('${list.id}')">
                            <i class="bi bi-printer me-1"></i> Imprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="row">${listsHtml}</div>`;
}

async function generateShoppingList() {
    if (currentMenus.length === 0) {
        showAlert("Vous devez d'abord créer un menu", 'warning');
        return;
    }

    const activeMenu = currentMenus.find(menu => menu.isActive);
    if (!activeMenu) {
        showAlert('Aucun menu actif trouvé', 'warning');
        return;
    }

    try {
        showAlert('Génération de la liste de courses...', 'info');
        const shoppingList = await api.post('/shopping-lists/generate', {
            menuId: activeMenu.id,
            userId: currentUser.id || 'default-user-id'
        });
        showAlert('Liste de courses générée avec succès!', 'success');
        await loadShoppingLists();
    } catch (error) {
        showAlert('Erreur lors de la génération de la liste', 'danger');
    }
}

// Gestion des Ingrédients
async function loadIngredients() {
    const container = document.getElementById('ingredients-list');
    container.innerHTML = `
        <div class="loading">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
            <p class="mt-3">Chargement des ingrédients...</p>
        </div>
    `;

    try {
        const categories = await api.get('/categories');
        displayIngredients(categories);
    } catch (error) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Erreur lors du chargement des ingrédients
            </div>
        `;
    }
}

function displayIngredients(categories) {
    const container = document.getElementById('ingredients-list');
    
    const categoriesHtml = categories.map(category => `
        <div class="mb-4 fade-in">
            <div class="category-header">
                ${category.displayName} (${category.ingredients.length} ingrédients)
            </div>
            <div class="row">
                ${category.ingredients.map(ingredient => `
                    <div class="col-md-4 col-lg-3 mb-2">
                        <div class="card card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${ingredient.name}</strong>
                                    <small class="text-muted d-block">Unité: ${ingredient.unit}</small>
                                </div>
                                <div class="d-flex gap-1">
                                    ${ingredient.dietaryTags.includes('kosher') ? '<i class="bi bi-check-circle text-success" title="Kasher"></i>' : '<i class="bi bi-x-circle text-danger" title="Non kasher"></i>'}
                                    <button class="btn btn-sm btn-outline-primary" onclick="editIngredient('${ingredient.id}')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    container.innerHTML = categoriesHtml;
}

// Fonctions utilitaires
async function showStats() {
    try {
        const stats = await api.get('/stats');
        showAlert(`
            <strong>Statistiques:</strong><br>
            Recettes: ${stats.recipes} | 
            Menus: ${stats.menus} | 
            Ingrédients: ${stats.ingredients}
        `, 'info');
    } catch (error) {
        showAlert('Erreur lors du chargement des statistiques', 'danger');
    }
}

// Fonctions de gestion des recettes
function createNewRecipe() {
    showCreateRecipeModal();
}

function showCreateRecipeModal() {
    const modalBody = document.getElementById('recipeModalBody');
    
    modalBody.innerHTML = `
        <form id="create-recipe-form">
            <div class="row">
                <div class="col-md-8">
                    <div class="mb-3">
                        <label class="form-label">Nom de la recette *</label>
                        <input type="text" class="form-control" id="recipe-name" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="recipe-description" rows="3"></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Type de repas *</label>
                                <select class="form-select" id="recipe-meal-type" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="lunch_children">Déjeuner Enfants</option>
                                    <option value="dinner_children">Dîner Enfants</option>
                                    <option value="dinner_adults">Dîner Adultes</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Difficulté</label>
                                <select class="form-select" id="recipe-difficulty">
                                    <option value="easy">Facile</option>
                                    <option value="medium" selected>Moyen</option>
                                    <option value="hard">Difficile</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Portions</label>
                                <input type="number" class="form-control" id="recipe-servings" value="4" min="1">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Préparation (min)</label>
                                <input type="number" class="form-control" id="recipe-prep-time" min="0">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Cuisson (min)</label>
                                <input type="number" class="form-control" id="recipe-cook-time" min="0">
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Restrictions alimentaires</label>
                        <div class="d-flex flex-wrap gap-2" id="dietary-tags">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-kosher" value="kosher" checked>
                                <label class="form-check-label" for="tag-kosher">Kasher</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-halal" value="halal">
                                <label class="form-check-label" for="tag-halal">Halal</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-vegan" value="vegan">
                                <label class="form-check-label" for="tag-vegan">Végétalien</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-vegetarian" value="vegetarian">
                                <label class="form-check-label" for="tag-vegetarian">Végétarien</label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Instructions *</label>
                        <div id="instructions-container">
                            <div class="instruction-item mb-2">
                                <div class="input-group">
                                    <span class="input-group-text">1</span>
                                    <input type="text" class="form-control instruction-input" placeholder="Étape 1...">
                                    <button type="button" class="btn btn-outline-danger" onclick="removeInstruction(this)">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="addInstruction()">
                            <i class="bi bi-plus"></i> Ajouter une étape
                        </button>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Ingrédients *</label>
                        <div id="ingredients-container">
                            <div class="ingredient-item mb-2">
                                <div class="row">
                                    <div class="col-6">
                                        <select class="form-select ingredient-select">
                                            <option value="">Choisir ingrédient...</option>
                                        </select>
                                    </div>
                                    <div class="col-4">
                                        <input type="number" class="form-control quantity-input" placeholder="Quantité" step="0.1">
                                    </div>
                                    <div class="col-2">
                                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeIngredient(this)">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="addIngredient()">
                            <i class="bi bi-plus"></i> Ajouter un ingrédient
                        </button>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Conseils (optionnel)</label>
                        <textarea class="form-control" id="recipe-tips" rows="3" placeholder="Conseils de préparation..."></textarea>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Suggestion de boisson</label>
                        <input type="text" class="form-control" id="recipe-drink" placeholder="Ex: Vin rouge, Jus de fruits...">
                    </div>
                </div>
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-check-lg me-1"></i> Créer la Recette
                </button>
            </div>
        </form>
    `;

    // Charger les ingrédients disponibles
    loadIngredientsForRecipe();
    
    // Configurer le formulaire
    document.getElementById('create-recipe-form').addEventListener('submit', handleCreateRecipe);
    
    const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
    document.getElementById('recipeModal').querySelector('.modal-title').textContent = 'Créer une Nouvelle Recette';
    modal.show();
}

async function loadIngredientsForRecipe() {
    try {
        const categories = await api.get('/categories');
        const allIngredients = [];
        
        categories.forEach(category => {
            category.ingredients.forEach(ingredient => {
                allIngredients.push({
                    id: ingredient.id,
                    name: ingredient.name,
                    unit: ingredient.unit,
                    category: category.displayName
                });
            });
        });
        
        // Populate all ingredient selects
        updateIngredientSelects(allIngredients);
        
    } catch (error) {
        console.error('Erreur lors du chargement des ingrédients:', error);
    }
}

function updateIngredientSelects(ingredients) {
    const selects = document.querySelectorAll('.ingredient-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Choisir ingrédient...</option>';
        
        let currentCategory = '';
        ingredients.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
                  .forEach(ingredient => {
            if (ingredient.category !== currentCategory) {
                currentCategory = ingredient.category;
                const optgroup = document.createElement('optgroup');
                optgroup.label = currentCategory;
                select.appendChild(optgroup);
            }
            
            const option = document.createElement('option');
            option.value = ingredient.id;
            option.textContent = `${ingredient.name} (${ingredient.unit})`;
            option.dataset.unit = ingredient.unit;
            select.lastElementChild.appendChild(option);
        });
        
        select.value = currentValue;
    });
}

function addInstruction() {
    const container = document.getElementById('instructions-container');
    const count = container.children.length + 1;
    
    const div = document.createElement('div');
    div.className = 'instruction-item mb-2';
    div.innerHTML = `
        <div class="input-group">
            <span class="input-group-text">${count}</span>
            <input type="text" class="form-control instruction-input" placeholder="Étape ${count}...">
            <button type="button" class="btn btn-outline-danger" onclick="removeInstruction(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(div);
    updateInstructionNumbers();
}

function removeInstruction(button) {
    const container = document.getElementById('instructions-container');
    if (container.children.length > 1) {
        button.closest('.instruction-item').remove();
        updateInstructionNumbers();
    }
}

function updateInstructionNumbers() {
    const instructions = document.querySelectorAll('.instruction-item');
    instructions.forEach((instruction, index) => {
        instruction.querySelector('.input-group-text').textContent = index + 1;
        instruction.querySelector('.instruction-input').placeholder = `Étape ${index + 1}...`;
    });
}

function addIngredient() {
    const container = document.getElementById('ingredients-container');
    
    const div = document.createElement('div');
    div.className = 'ingredient-item mb-2';
    div.innerHTML = `
        <div class="row">
            <div class="col-6">
                <select class="form-select ingredient-select">
                    <option value="">Choisir ingrédient...</option>
                </select>
            </div>
            <div class="col-4">
                <input type="number" class="form-control quantity-input" placeholder="Quantité" step="0.1">
            </div>
            <div class="col-2">
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeIngredient(this)">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(div);
    
    // Load ingredients for the new select
    loadIngredientsForRecipe();
}

function removeIngredient(button) {
    const container = document.getElementById('ingredients-container');
    if (container.children.length > 1) {
        button.closest('.ingredient-item').remove();
    }
}

async function handleCreateRecipe(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // Désactiver le bouton
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Création...';
        
        // Collecter les données du formulaire
        const recipeData = {
            name: document.getElementById('recipe-name').value,
            description: document.getElementById('recipe-description').value,
            mealType: document.getElementById('recipe-meal-type').value,
            difficulty: document.getElementById('recipe-difficulty').value,
            servings: parseInt(document.getElementById('recipe-servings').value),
            prepTime: parseInt(document.getElementById('recipe-prep-time').value) || null,
            cookTime: parseInt(document.getElementById('recipe-cook-time').value) || null,
            audience: document.getElementById('recipe-meal-type').value.includes('children') ? 'children' : 'adults',
            
            // Restrictions alimentaires
            dietaryTags: Array.from(document.querySelectorAll('#dietary-tags input:checked')).map(cb => cb.value),
            
            // Instructions
            instructions: Array.from(document.querySelectorAll('.instruction-input'))
                              .map(input => input.value.trim())
                              .filter(instruction => instruction),
            
            // Conseils
            tips: document.getElementById('recipe-tips').value.trim() ? 
                  document.getElementById('recipe-tips').value.split('\n').filter(tip => tip.trim()) : [],
            
            // Boisson suggérée
            suggestedDrink: document.getElementById('recipe-drink').value.trim() || null,
            
            // Ingrédients
            ingredients: []
        };
        
        // Collecter les ingrédients
        const ingredientItems = document.querySelectorAll('.ingredient-item');
        ingredientItems.forEach(item => {
            const select = item.querySelector('.ingredient-select');
            const quantityInput = item.querySelector('.quantity-input');
            
            if (select.value && quantityInput.value) {
                const selectedOption = select.options[select.selectedIndex];
                recipeData.ingredients.push({
                    ingredientId: select.value,
                    quantity: parseFloat(quantityInput.value),
                    unit: selectedOption.dataset.unit || 'piece'
                });
            }
        });
        
        // Validation
        if (!recipeData.name || !recipeData.mealType) {
            throw new Error('Nom et type de repas sont obligatoires');
        }
        
        if (recipeData.instructions.length === 0) {
            throw new Error('Au moins une instruction est requise');
        }
        
        if (recipeData.ingredients.length === 0) {
            throw new Error('Au moins un ingrédient est requis');
        }
        
        // Calculer le temps total
        recipeData.totalTime = (recipeData.prepTime || 0) + (recipeData.cookTime || 0) || null;
        
        // Créer la recette
        const newRecipe = await api.post('/recipes', recipeData);
        
        showAlert('Recette créée avec succès !', 'success');
        
        // Fermer le modal et recharger les recettes
        bootstrap.Modal.getInstance(document.getElementById('recipeModal')).hide();
        await loadRecipes();
        
        // Si une assignation est en attente, l'effectuer
        if (window.pendingMealAssignment) {
            await selectRecipeForMeal(window.pendingMealAssignment, newRecipe.id);
            window.pendingMealAssignment = null;
        }
        
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        showAlert(`Erreur: ${error.message}`, 'danger');
    } finally {
        // Réactiver le bouton
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

async function editRecipe(recipeId) {
    try {
        const recipe = await api.get(`/recipes/${recipeId}`);
        showEditRecipeModal(recipe);
    } catch (error) {
        showAlert('Erreur lors du chargement de la recette', 'danger');
    }
}

function showEditRecipeModal(recipe) {
    const modalBody = document.getElementById('recipeModalBody');
    
    modalBody.innerHTML = `
        <form id="edit-recipe-form">
            <input type="hidden" id="recipe-id" value="${recipe.id}">
            <div class="row">
                <div class="col-md-8">
                    <div class="mb-3">
                        <label class="form-label">Nom de la recette *</label>
                        <input type="text" class="form-control" id="recipe-name" value="${recipe.name}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="recipe-description" rows="3">${recipe.description || ''}</textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Type de repas *</label>
                                <select class="form-select" id="recipe-meal-type" required>
                                    <option value="lunch_children" ${recipe.mealType === 'lunch_children' ? 'selected' : ''}>Déjeuner Enfants</option>
                                    <option value="dinner_children" ${recipe.mealType === 'dinner_children' ? 'selected' : ''}>Dîner Enfants</option>
                                    <option value="dinner_adults" ${recipe.mealType === 'dinner_adults' ? 'selected' : ''}>Dîner Adultes</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Difficulté</label>
                                <select class="form-select" id="recipe-difficulty">
                                    <option value="easy" ${recipe.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
                                    <option value="medium" ${recipe.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
                                    <option value="hard" ${recipe.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Portions</label>
                                <input type="number" class="form-control" id="recipe-servings" value="${recipe.servings}" min="1">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Préparation (min)</label>
                                <input type="number" class="form-control" id="recipe-prep-time" value="${recipe.prepTime || ''}" min="0">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Cuisson (min)</label>
                                <input type="number" class="form-control" id="recipe-cook-time" value="${recipe.cookTime || ''}" min="0">
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Restrictions alimentaires</label>
                        <div class="d-flex flex-wrap gap-2" id="dietary-tags">
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-kosher" value="kosher" 
                                       ${recipe.dietaryTags.includes('kosher') ? 'checked' : ''}>
                                <label class="form-check-label" for="tag-kosher">Kasher</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-halal" value="halal"
                                       ${recipe.dietaryTags.includes('halal') ? 'checked' : ''}>
                                <label class="form-check-label" for="tag-halal">Halal</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-vegan" value="vegan"
                                       ${recipe.dietaryTags.includes('vegan') ? 'checked' : ''}>
                                <label class="form-check-label" for="tag-vegan">Végétalien</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="checkbox" id="tag-vegetarian" value="vegetarian"
                                       ${recipe.dietaryTags.includes('vegetarian') ? 'checked' : ''}>
                                <label class="form-check-label" for="tag-vegetarian">Végétarien</label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Instructions *</label>
                        <div id="instructions-container">
                            ${recipe.instructions.map((instruction, index) => `
                                <div class="instruction-item mb-2">
                                    <div class="input-group">
                                        <span class="input-group-text">${index + 1}</span>
                                        <input type="text" class="form-control instruction-input" value="${instruction}" placeholder="Étape ${index + 1}...">
                                        <button type="button" class="btn btn-outline-danger" onclick="removeInstruction(this)">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="addInstruction()">
                            <i class="bi bi-plus"></i> Ajouter une étape
                        </button>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Ingrédients *</label>
                        <div id="ingredients-container">
                            ${recipe.ingredients.map(ing => `
                                <div class="ingredient-item mb-2">
                                    <div class="row">
                                        <div class="col-6">
                                            <select class="form-select ingredient-select">
                                                <option value="${ing.ingredientId}" selected>${ing.ingredient.name} (${ing.ingredient.unit})</option>
                                            </select>
                                        </div>
                                        <div class="col-4">
                                            <input type="number" class="form-control quantity-input" value="${ing.quantity}" step="0.1">
                                        </div>
                                        <div class="col-2">
                                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeIngredient(this)">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="addIngredient()">
                            <i class="bi bi-plus"></i> Ajouter un ingrédient
                        </button>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Conseils (optionnel)</label>
                        <textarea class="form-control" id="recipe-tips" rows="3">${recipe.tips.join('\n')}</textarea>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Suggestion de boisson</label>
                        <input type="text" class="form-control" id="recipe-drink" value="${recipe.suggestedDrink || ''}">
                    </div>
                </div>
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-check-lg me-1"></i> Mettre à jour
                </button>
            </div>
        </form>
    `;

    // Charger les ingrédients disponibles
    loadIngredientsForRecipe();
    
    // Configurer le formulaire
    document.getElementById('edit-recipe-form').addEventListener('submit', handleEditRecipe);
    
    const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
    document.getElementById('recipeModal').querySelector('.modal-title').textContent = 'Modifier la Recette';
    modal.show();
}

async function handleEditRecipe(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    const recipeId = document.getElementById('recipe-id').value;
    
    try {
        // Désactiver le bouton
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mise à jour...';
        
        // Collecter les données du formulaire (même logique que création)
        const recipeData = {
            name: document.getElementById('recipe-name').value,
            description: document.getElementById('recipe-description').value,
            mealType: document.getElementById('recipe-meal-type').value,
            difficulty: document.getElementById('recipe-difficulty').value,
            servings: parseInt(document.getElementById('recipe-servings').value),
            prepTime: parseInt(document.getElementById('recipe-prep-time').value) || null,
            cookTime: parseInt(document.getElementById('recipe-cook-time').value) || null,
            audience: document.getElementById('recipe-meal-type').value.includes('children') ? 'children' : 'adults',
            
            dietaryTags: Array.from(document.querySelectorAll('#dietary-tags input:checked')).map(cb => cb.value),
            
            instructions: Array.from(document.querySelectorAll('.instruction-input'))
                              .map(input => input.value.trim())
                              .filter(instruction => instruction),
            
            tips: document.getElementById('recipe-tips').value.trim() ? 
                  document.getElementById('recipe-tips').value.split('\n').filter(tip => tip.trim()) : [],
            
            suggestedDrink: document.getElementById('recipe-drink').value.trim() || null,
            
            ingredients: []
        };
        
        // Collecter les ingrédients
        const ingredientItems = document.querySelectorAll('.ingredient-item');
        ingredientItems.forEach(item => {
            const select = item.querySelector('.ingredient-select');
            const quantityInput = item.querySelector('.quantity-input');
            
            if (select.value && quantityInput.value) {
                const selectedOption = select.options[select.selectedIndex];
                recipeData.ingredients.push({
                    ingredientId: select.value,
                    quantity: parseFloat(quantityInput.value),
                    unit: selectedOption.dataset.unit || 'piece'
                });
            }
        });
        
        // Validation
        if (!recipeData.name || !recipeData.mealType) {
            throw new Error('Nom et type de repas sont obligatoires');
        }
        
        if (recipeData.instructions.length === 0) {
            throw new Error('Au moins une instruction est requise');
        }
        
        if (recipeData.ingredients.length === 0) {
            throw new Error('Au moins un ingrédient est requis');
        }
        
        // Calculer le temps total
        recipeData.totalTime = (recipeData.prepTime || 0) + (recipeData.cookTime || 0) || null;
        
        // Mettre à jour la recette
        const updatedRecipe = await api.put(`/recipes/${recipeId}`, recipeData);
        
        showAlert('Recette mise à jour avec succès !', 'success');
        
        // Fermer le modal et recharger les recettes
        bootstrap.Modal.getInstance(document.getElementById('recipeModal')).hide();
        await loadRecipes();
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        showAlert(`Erreur: ${error.message}`, 'danger');
    } finally {
        // Réactiver le bouton
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

async function duplicateMenu(menuId) {
    try {
        const menu = await api.get(`/menus/${menuId}`);
        
        const newName = prompt(`Nom du menu dupliqué:`, `${menu.name} - Copie`);
        if (!newName) return;
        
        const newStartDate = prompt('Nouvelle date de début (YYYY-MM-DD):', 
                                   new Date().toISOString().split('T')[0]);
        if (!newStartDate) return;
        
        showAlert('Duplication du menu en cours...', 'info');
        
        const duplicatedMenu = await api.post(`/menus/${menuId}/duplicate`, {
            name: newName,
            startDate: newStartDate
        });
        
        showAlert('Menu dupliqué avec succès !', 'success');
        await loadMenus();
        
    } catch (error) {
        console.error('Erreur lors de la duplication:', error);
        showAlert('Erreur lors de la duplication du menu', 'danger');
    }
}

async function assignRecipe(mealId) {
    try {
        // Charger les recettes disponibles
        const recipes = await api.get('/recipes');
        
        // Créer le modal de sélection
        const modalBody = document.getElementById('recipeModalBody');
        
        modalBody.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Sélectionner une recette :</label>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <input type="text" class="form-control" id="recipe-search-assign" placeholder="Rechercher une recette...">
                    </div>
                    <div class="col-md-6">
                        <select class="form-select" id="recipe-filter-assign">
                            <option value="">Tous les types</option>
                            <option value="lunch_children">Déjeuner Enfants</option>
                            <option value="dinner_children">Dîner Enfants</option>
                            <option value="dinner_adults">Dîner Adultes</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div id="recipes-selection" style="max-height: 400px; overflow-y: auto;">
                ${recipes.map(recipe => `
                    <div class="recipe-option card mb-2" data-recipe-id="${recipe.id}" data-meal-type="${recipe.mealType}">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-1">${recipe.name}</h6>
                                    <small class="text-muted">
                                        ${formatMealType(recipe.mealType)} • 
                                        ${recipe.prepTime ? recipe.prepTime + 'min prep' : ''} • 
                                        ${recipe.servings} portions
                                    </small>
                                </div>
                                <button class="btn btn-outline-primary btn-sm" onclick="selectRecipeForMeal('${mealId}', '${recipe.id}')">
                                    Choisir
                                </button>
                            </div>
                            ${recipe.description ? `<p class="mb-0 mt-1"><small>${recipe.description}</small></p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <hr>
            <div class="text-end">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <button type="button" class="btn btn-success" onclick="createNewRecipeForMeal('${mealId}')">
                    <i class="bi bi-plus-lg me-1"></i> Créer Nouvelle Recette
                </button>
            </div>
        `;
        
        // Configurer les filtres
        setupRecipeAssignFilters();
        
        const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        document.getElementById('recipeModal').querySelector('.modal-title').textContent = 'Assigner une Recette';
        modal.show();
        
    } catch (error) {
        console.error('Erreur lors du chargement des recettes:', error);
        showAlert('Erreur lors du chargement des recettes', 'danger');
    }
}

function setupRecipeAssignFilters() {
    const searchInput = document.getElementById('recipe-search-assign');
    const filterSelect = document.getElementById('recipe-filter-assign');
    
    const filterRecipes = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const mealTypeFilter = filterSelect.value;
        
        const recipeOptions = document.querySelectorAll('.recipe-option');
        
        recipeOptions.forEach(option => {
            const recipeName = option.querySelector('h6').textContent.toLowerCase();
            const recipeMealType = option.dataset.mealType;
            
            const matchesSearch = !searchTerm || recipeName.includes(searchTerm);
            const matchesMealType = !mealTypeFilter || recipeMealType === mealTypeFilter;
            
            option.style.display = (matchesSearch && matchesMealType) ? 'block' : 'none';
        });
    };
    
    searchInput.addEventListener('input', filterRecipes);
    filterSelect.addEventListener('change', filterRecipes);
}

async function selectRecipeForMeal(mealId, recipeId) {
    try {
        showAlert('Assignation de la recette...', 'info');
        
        await api.put(`/meals/${mealId}`, {
            recipeId: recipeId
        });
        
        showAlert('Recette assignée avec succès !', 'success');
        
        // Fermer le modal et recharger les menus
        bootstrap.Modal.getInstance(document.getElementById('recipeModal')).hide();
        await loadMenus();
        
    } catch (error) {
        console.error('Erreur lors de l\'assignation:', error);
        showAlert('Erreur lors de l\'assignation de la recette', 'danger');
    }
}

function createNewRecipeForMeal(mealId) {
    // Fermer le modal actuel
    bootstrap.Modal.getInstance(document.getElementById('recipeModal')).hide();
    
    // Stocker l'ID du repas pour assignation automatique après création
    window.pendingMealAssignment = mealId;
    
    // Ouvrir le modal de création de recette
    setTimeout(() => {
        createNewRecipe();
    }, 300);
}

async function generateShoppingListFromMenu(menuId) {
    try {
        showAlert('Génération de la liste de courses...', 'info');
        
        const shoppingList = await api.post('/shopping-lists/generate', {
            menuId: menuId,
            userId: currentUser.id || 'default-user-id'
        });
        
        showAlert('Liste de courses générée avec succès !', 'success');
        
        // Fermer le modal et basculer sur l'onglet courses
        bootstrap.Modal.getInstance(document.getElementById('menuModal')).hide();
        
        // Activer l'onglet courses
        const shoppingTab = document.getElementById('shopping-tab');
        bootstrap.Tab.getOrCreateInstance(shoppingTab).show();
        
        await loadShoppingLists();
        
    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        showAlert('Erreur lors de la génération de la liste', 'danger');
    }
}

async function exportMenu(menuId) {
    try {
        const menu = await api.get(`/menus/${menuId}`);
        generateMenuPDF(menu);
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        showAlert('Erreur lors de l\'export du menu', 'danger');
    }
}

function generateMenuPDF(menu) {
    // Créer une version imprimable du menu
    const printWindow = window.open('', '_blank');
    
    // Organiser les repas par jour
    const mealsByDay = {};
    menu.meals.forEach(meal => {
        const dateKey = new Date(meal.date).toDateString();
        if (!mealsByDay[dateKey]) {
            mealsByDay[dateKey] = {};
        }
        mealsByDay[dateKey][meal.mealType] = meal;
    });
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Menu - ${menu.name}</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
                    margin: 20px; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 3px solid #2E5266; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px; 
                }
                .header h1 { 
                    color: #2E5266; 
                    margin-bottom: 10px;
                    font-size: 2.5em;
                }
                .subtitle { 
                    color: #666; 
                    font-size: 1.2em;
                }
                .day-section { 
                    page-break-inside: avoid; 
                    margin-bottom: 30px; 
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .day-header { 
                    background-color: #F4A261; 
                    color: white; 
                    padding: 15px; 
                    font-weight: bold; 
                    font-size: 1.3em;
                }
                .meals-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                    gap: 20px; 
                    padding: 20px;
                }
                .meal-card { 
                    border: 1px solid #eee; 
                    border-radius: 6px; 
                    padding: 15px;
                    background-color: #fafafa;
                }
                .meal-type { 
                    font-weight: bold; 
                    color: #2E5266; 
                    font-size: 0.9em; 
                    text-transform: uppercase; 
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }
                .recipe-name { 
                    font-size: 1.1em; 
                    font-weight: 600; 
                    margin-bottom: 8px;
                    color: #333;
                }
                .recipe-description { 
                    color: #666; 
                    font-size: 0.9em; 
                    margin-bottom: 10px;
                }
                .recipe-meta { 
                    font-size: 0.8em; 
                    color: #888;
                    display: flex;
                    gap: 15px;
                }
                .ingredients-section {
                    margin-top: 40px;
                    page-break-before: auto;
                }
                .ingredients-title {
                    color: #2E5266;
                    font-size: 1.5em;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #F4A261;
                    padding-bottom: 10px;
                }
                .ingredient-category {
                    margin-bottom: 20px;
                }
                .category-name {
                    background-color: #2E5266;
                    color: white;
                    padding: 8px 15px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .ingredient-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 8px;
                    padding-left: 15px;
                }
                .ingredient-item {
                    padding: 5px 0;
                    border-bottom: 1px dotted #ccc;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    .day-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${menu.name}</h1>
                <div class="subtitle">
                    Du ${formatDate(menu.startDate)} au ${formatDate(menu.endDate)}<br>
                    Généré le ${new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
    `);
    
    // Générer les jours
    Object.keys(mealsByDay).sort().forEach(dateKey => {
        const date = new Date(dateKey);
        const dayMeals = mealsByDay[dateKey];
        
        printWindow.document.write(`
            <div class="day-section">
                <div class="day-header">${formatDate(date)}</div>
                <div class="meals-grid">
        `);
        
        // Générer les repas du jour
        Object.entries(dayMeals).forEach(([mealType, meal]) => {
            const mealTypeLabel = formatMealType(mealType);
            
            printWindow.document.write(`
                <div class="meal-card">
                    <div class="meal-type">${mealTypeLabel}</div>
                    ${meal.recipe ? `
                        <div class="recipe-name">${meal.recipe.name}</div>
                        <div class="recipe-description">${meal.recipe.description || ''}</div>
                        <div class="recipe-meta">
                            ${meal.recipe.prepTime ? `<span>⏱ ${meal.recipe.prepTime}min</span>` : ''}
                            ${meal.recipe.servings ? `<span>👥 ${meal.recipe.servings}p</span>` : ''}
                            ${meal.recipe.difficulty ? `<span>⭐ ${meal.recipe.difficulty}</span>` : ''}
                        </div>
                    ` : `
                        <div class="recipe-name text-muted">Aucune recette assignée</div>
                    `}
                </div>
            `);
        });
        
        printWindow.document.write(`
                </div>
            </div>
        `);
    });
    
    // Générer la liste des ingrédients si des recettes sont assignées
    const allIngredients = {};
    menu.meals.filter(meal => meal.recipe).forEach(meal => {
        meal.recipe.ingredients.forEach(ing => {
            const key = ing.ingredient.name;
            if (!allIngredients[key]) {
                allIngredients[key] = {
                    name: ing.ingredient.name,
                    category: ing.ingredient.category?.displayName || 'Autres',
                    unit: ing.unit || ing.ingredient.unit,
                    totalQuantity: 0
                };
            }
            allIngredients[key].totalQuantity += ing.quantity;
        });
    });
    
    if (Object.keys(allIngredients).length > 0) {
        // Organiser par catégorie
        const ingredientsByCategory = {};
        Object.values(allIngredients).forEach(ingredient => {
            if (!ingredientsByCategory[ingredient.category]) {
                ingredientsByCategory[ingredient.category] = [];
            }
            ingredientsByCategory[ingredient.category].push(ingredient);
        });
        
        printWindow.document.write(`
            <div class="ingredients-section">
                <h2 class="ingredients-title">Liste des Ingrédients</h2>
        `);
        
        Object.entries(ingredientsByCategory).forEach(([category, ingredients]) => {
            printWindow.document.write(`
                <div class="ingredient-category">
                    <div class="category-name">${category}</div>
                    <div class="ingredient-list">
            `);
            
            ingredients.sort((a, b) => a.name.localeCompare(b.name)).forEach(ingredient => {
                printWindow.document.write(`
                    <div class="ingredient-item">
                        <strong>${ingredient.name}</strong> - ${ingredient.totalQuantity}${ingredient.unit}
                    </div>
                `);
            });
            
            printWindow.document.write(`
                    </div>
                </div>
            `);
        });
        
        printWindow.document.write(`
            </div>
        `);
    }
    
    printWindow.document.write(`
            <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; margin: 5px; font-size: 16px;">Imprimer / Sauvegarder PDF</button>
                <button onclick="window.close()" style="padding: 10px 20px; margin: 5px; font-size: 16px;">Fermer</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Lancer l'impression automatiquement après chargement
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
}

async function viewShoppingList(listId) {
    try {
        const shoppingList = await api.get(`/shopping-lists/${listId}`);
        showShoppingListDetails(shoppingList);
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showAlert('Erreur lors du chargement de la liste', 'danger');
    }
}

function showShoppingListDetails(shoppingList) {
    const modalBody = document.getElementById('menuModalBody');
    
    // Organiser les articles par catégorie
    const itemsByCategory = {};
    shoppingList.items.forEach(item => {
        const categoryName = item.ingredient.category.displayName;
        if (!itemsByCategory[categoryName]) {
            itemsByCategory[categoryName] = [];
        }
        itemsByCategory[categoryName].push(item);
    });
    
    const categoriesHtml = Object.entries(itemsByCategory).map(([categoryName, items]) => `
        <div class="category-section mb-4">
            <div class="category-header">
                <i class="bi bi-tag-fill me-2"></i>${categoryName}
            </div>
            <div class="category-items">
                ${items.map(item => `
                    <div class="shopping-list-item ${item.isPurchased ? 'purchased' : ''}" data-item-id="${item.id}">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <input type="checkbox" class="form-check-input me-3" 
                                       ${item.isPurchased ? 'checked' : ''} 
                                       onchange="togglePurchased('${item.id}', this.checked)">
                                <div>
                                    <strong>${item.ingredient.name}</strong>
                                    <div class="text-muted small">
                                        ${item.totalQuantity}${item.unit} 
                                        ${item.estimatedCost ? `• ~${item.estimatedCost}€` : ''}
                                    </div>
                                </div>
                            </div>
                            ${item.notes ? `<small class="text-muted">${item.notes}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    const completedItems = shoppingList.items.filter(item => item.isPurchased).length;
    const totalItems = shoppingList.items.length;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    modalBody.innerHTML = `
        <div class="mb-4">
            <h4>${shoppingList.name}</h4>
            <p class="text-muted">Menu : ${shoppingList.menu.name}</p>
            
            <div class="progress mb-3">
                <div class="progress-bar bg-success" style="width: ${progressPercent}%"></div>
            </div>
            
            <div class="row text-center">
                <div class="col-4">
                    <div class="h5 mb-0 text-primary">${totalItems}</div>
                    <small class="text-muted">Articles</small>
                </div>
                <div class="col-4">
                    <div class="h5 mb-0 text-success">${completedItems}</div>
                    <small class="text-muted">Achetés</small>
                </div>
                <div class="col-4">
                    <div class="h5 mb-0 text-warning">${totalItems - completedItems}</div>
                    <small class="text-muted">Restants</small>
                </div>
            </div>
        </div>
        
        <div class="shopping-list-content">
            ${categoriesHtml}
        </div>
        
        <div class="mt-4 text-end">
            <button type="button" class="btn btn-outline-primary me-2" onclick="printShoppingList('${shoppingList.id}')">
                <i class="bi bi-printer me-1"></i> Imprimer
            </button>
            <button type="button" class="btn btn-success" onclick="markAllPurchased('${shoppingList.id}')">
                <i class="bi bi-check-all me-1"></i> Tout marquer acheté
            </button>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('menuModal'));
    document.getElementById('menuModal').querySelector('.modal-title').textContent = 'Liste de Courses';
    modal.show();
}

async function togglePurchased(itemId, isPurchased) {
    try {
        await api.put(`/shopping-lists/items/${itemId}`, {
            isPurchased: isPurchased
        });
        
        // Mettre à jour visuellement l'item
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (isPurchased) {
            itemElement.classList.add('purchased');
        } else {
            itemElement.classList.remove('purchased');
        }
        
        // Recalculer et mettre à jour la barre de progrès
        updateProgressBar();
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        showAlert('Erreur lors de la mise à jour de l\'article', 'danger');
    }
}

function updateProgressBar() {
    const allItems = document.querySelectorAll('.shopping-list-item');
    const purchasedItems = document.querySelectorAll('.shopping-list-item.purchased');
    
    const totalItems = allItems.length;
    const completedItems = purchasedItems.length;
    const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
    
    // Mettre à jour les compteurs
    const counters = document.querySelectorAll('.text-center .h5');
    if (counters.length >= 3) {
        counters[1].textContent = completedItems; // Achetés
        counters[2].textContent = totalItems - completedItems; // Restants
    }
}

async function markAllPurchased(listId) {
    try {
        await api.put(`/shopping-lists/${listId}/mark-all-purchased`);
        
        // Marquer tous les items visuellement
        document.querySelectorAll('.shopping-list-item').forEach(item => {
            item.classList.add('purchased');
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.checked = true;
        });
        
        updateProgressBar();
        showAlert('Tous les articles ont été marqués comme achetés', 'success');
        
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de la mise à jour', 'danger');
    }
}

function printShoppingList(listId) {
    // Créer une version imprimable de la liste
    const modalContent = document.getElementById('menuModalBody');
    const listName = modalContent.querySelector('h4').textContent;
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Liste de Courses - ${listName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .category-header { background-color: #f0f0f0; padding: 8px; font-weight: bold; margin: 15px 0 5px 0; }
                .shopping-item { padding: 5px 0; border-bottom: 1px dotted #ccc; display: flex; justify-content: space-between; }
                .checkbox { width: 20px; height: 20px; border: 2px solid #333; display: inline-block; margin-right: 10px; }
                .purchased { text-decoration: line-through; opacity: 0.6; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Liste de Courses</h1>
                <h2>${listName}</h2>
                <p>Générée le ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
    `);
    
    // Extraire le contenu des catégories
    const categories = modalContent.querySelectorAll('.category-section');
    categories.forEach(category => {
        const categoryName = category.querySelector('.category-header').textContent;
        printWindow.document.write(`<div class="category-header">${categoryName}</div>`);
        
        const items = category.querySelectorAll('.shopping-list-item');
        items.forEach(item => {
            const isPurchased = item.classList.contains('purchased');
            const itemName = item.querySelector('strong').textContent;
            const itemDetails = item.querySelector('.text-muted.small').textContent;
            
            printWindow.document.write(`
                <div class="shopping-item ${isPurchased ? 'purchased' : ''}">
                    <div>
                        <span class="checkbox">${isPurchased ? '✓' : ''}</span>
                        <strong>${itemName}</strong>
                        <span style="color: #666; font-size: 0.9em;"> - ${itemDetails}</span>
                    </div>
                </div>
            `);
        });
    });
    
    printWindow.document.write(`
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()">Imprimer</button>
                <button onclick="window.close()">Fermer</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // Lancer l'impression automatiquement
    printWindow.onload = function() {
        printWindow.print();
    };
}

function addNewIngredient() {
    showAddIngredientModal();
}

function showAddIngredientModal() {
    const modalBody = document.getElementById('recipeModalBody');
    
    modalBody.innerHTML = `
        <form id="add-ingredient-form">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Nom de l'ingrédient *</label>
                        <input type="text" class="form-control" id="ingredient-name" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Unité de mesure *</label>
                        <select class="form-select" id="ingredient-unit" required>
                            <option value="">Sélectionner...</option>
                            <option value="g">Grammes (g)</option>
                            <option value="kg">Kilogrammes (kg)</option>
                            <option value="ml">Millilitres (ml)</option>
                            <option value="l">Litres (l)</option>
                            <option value="piece">Pièce(s)</option>
                            <option value="bunch">Botte(s)</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Catégorie *</label>
                        <select class="form-select" id="ingredient-category" required>
                            <option value="">Sélectionner...</option>
                        </select>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Calories par 100g</label>
                        <input type="number" class="form-control" id="ingredient-calories" min="0">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Coût moyen</label>
                        <select class="form-select" id="ingredient-cost">
                            <option value="low">Économique</option>
                            <option value="medium" selected>Modéré</option>
                            <option value="high">Premium</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Restrictions alimentaires</label>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-kosher" value="kosher" checked>
                                <label class="form-check-label" for="diet-kosher">Kasher</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-halal" value="halal">
                                <label class="form-check-label" for="diet-halal">Halal</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-vegan" value="vegan">
                                <label class="form-check-label" for="diet-vegan">Végétalien</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-vegetarian" value="vegetarian">
                                <label class="form-check-label" for="diet-vegetarian">Végétarien</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Allergènes</label>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-nuts" value="nuts">
                                <label class="form-check-label" for="allergen-nuts">Fruits à coque</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-dairy" value="dairy">
                                <label class="form-check-label" for="allergen-dairy">Laitier</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-gluten" value="gluten">
                                <label class="form-check-label" for="allergen-gluten">Gluten</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-eggs" value="eggs">
                                <label class="form-check-label" for="allergen-eggs">Œufs</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-check-lg me-1"></i> Ajouter l'Ingrédient
                </button>
            </div>
        </form>
    `;
    
    // Charger les catégories
    loadCategoriesForIngredient();
    
    // Configurer le formulaire
    document.getElementById('add-ingredient-form').addEventListener('submit', handleAddIngredient);
    
    const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
    document.getElementById('recipeModal').querySelector('.modal-title').textContent = 'Ajouter un Ingrédient';
    modal.show();
}

async function loadCategoriesForIngredient() {
    try {
        const categories = await api.get('/categories');
        const categorySelect = document.getElementById('ingredient-category');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.displayName;
            categorySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

async function handleAddIngredient(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ajout...';
        
        const ingredientData = {
            name: document.getElementById('ingredient-name').value,
            unit: document.getElementById('ingredient-unit').value,
            categoryId: document.getElementById('ingredient-category').value,
            caloriesPer100g: parseInt(document.getElementById('ingredient-calories').value) || null,
            averageCost: document.getElementById('ingredient-cost').value,
            
            // Régimes alimentaires
            dietaryTags: Array.from(document.querySelectorAll('[id^="diet-"]:checked')).map(cb => cb.value),
            
            // Allergènes
            allergens: Array.from(document.querySelectorAll('[id^="allergen-"]:checked')).map(cb => cb.value),
            
            // Valeurs par défaut
            seasonality: ['year_round'],
            shelfLife: null
        };
        
        // Validation
        if (!ingredientData.name || !ingredientData.unit || !ingredientData.categoryId) {
            throw new Error('Nom, unité et catégorie sont obligatoires');
        }
        
        const newIngredient = await api.post('/ingredients', ingredientData);
        
        showAlert('Ingrédient ajouté avec succès !', 'success');
        
        // Fermer le modal et recharger les ingrédients
        bootstrap.Modal.getInstance(document.getElementById('recipeModal')).hide();
        await loadIngredients();
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout:', error);
        showAlert(`Erreur: ${error.message}`, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

async function editIngredient(ingredientId) {
    try {
        const ingredient = await api.get(`/ingredients/${ingredientId}`);
        showEditIngredientModal(ingredient);
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors du chargement de l\'ingrédient', 'danger');
    }
}

function showEditIngredientModal(ingredient) {
    const modalBody = document.getElementById('recipeModalBody');
    
    modalBody.innerHTML = `
        <form id="edit-ingredient-form">
            <input type="hidden" id="ingredient-id" value="${ingredient.id}">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Nom de l'ingrédient *</label>
                        <input type="text" class="form-control" id="ingredient-name" value="${ingredient.name}" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Unité de mesure *</label>
                        <select class="form-select" id="ingredient-unit" required>
                            <option value="g" ${ingredient.unit === 'g' ? 'selected' : ''}>Grammes (g)</option>
                            <option value="kg" ${ingredient.unit === 'kg' ? 'selected' : ''}>Kilogrammes (kg)</option>
                            <option value="ml" ${ingredient.unit === 'ml' ? 'selected' : ''}>Millilitres (ml)</option>
                            <option value="l" ${ingredient.unit === 'l' ? 'selected' : ''}>Litres (l)</option>
                            <option value="piece" ${ingredient.unit === 'piece' ? 'selected' : ''}>Pièce(s)</option>
                            <option value="bunch" ${ingredient.unit === 'bunch' ? 'selected' : ''}>Botte(s)</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Catégorie *</label>
                        <select class="form-select" id="ingredient-category" required>
                            <option value="">Sélectionner...</option>
                        </select>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Calories par 100g</label>
                        <input type="number" class="form-control" id="ingredient-calories" value="${ingredient.caloriesPer100g || ''}" min="0">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Coût moyen</label>
                        <select class="form-select" id="ingredient-cost">
                            <option value="low" ${ingredient.averageCost === 'low' ? 'selected' : ''}>Économique</option>
                            <option value="medium" ${ingredient.averageCost === 'medium' ? 'selected' : ''}>Modéré</option>
                            <option value="high" ${ingredient.averageCost === 'high' ? 'selected' : ''}>Premium</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Restrictions alimentaires</label>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-kosher" value="kosher" 
                                       ${ingredient.dietaryTags.includes('kosher') ? 'checked' : ''}>
                                <label class="form-check-label" for="diet-kosher">Kasher</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-halal" value="halal"
                                       ${ingredient.dietaryTags.includes('halal') ? 'checked' : ''}>
                                <label class="form-check-label" for="diet-halal">Halal</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-vegan" value="vegan"
                                       ${ingredient.dietaryTags.includes('vegan') ? 'checked' : ''}>
                                <label class="form-check-label" for="diet-vegan">Végétalien</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="diet-vegetarian" value="vegetarian"
                                       ${ingredient.dietaryTags.includes('vegetarian') ? 'checked' : ''}>
                                <label class="form-check-label" for="diet-vegetarian">Végétarien</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Allergènes</label>
                        <div class="d-flex flex-wrap gap-2">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-nuts" value="nuts"
                                       ${ingredient.allergens.includes('nuts') ? 'checked' : ''}>
                                <label class="form-check-label" for="allergen-nuts">Fruits à coque</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-dairy" value="dairy"
                                       ${ingredient.allergens.includes('dairy') ? 'checked' : ''}>
                                <label class="form-check-label" for="allergen-dairy">Laitier</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-gluten" value="gluten"
                                       ${ingredient.allergens.includes('gluten') ? 'checked' : ''}>
                                <label class="form-check-label" for="allergen-gluten">Gluten</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allergen-eggs" value="eggs"
                                       ${ingredient.allergens.includes('eggs') ? 'checked' : ''}>
                                <label class="form-check-label" for="allergen-eggs">Œufs</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">Annuler</button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-check-lg me-1"></i> Mettre à jour
                </button>
            </div>
        </form>
    `;
    
    // Charger les catégories et sélectionner la bonne
    loadCategoriesForIngredientEdit(ingredient.categoryId);
    
    // Configurer le formulaire
    document.getElementById('edit-ingredient-form').addEventListener('submit', handleEditIngredient);
    
    const modal = new bootstrap.Modal(document.getElementById('recipeModal'));
    document.getElementById('recipeModal').querySelector('.modal-title').textContent = 'Modifier l\'Ingrédient';
    modal.show();
}

async function loadCategoriesForIngredientEdit(selectedCategoryId) {
    try {
        const categories = await api.get('/categories');
        const categorySelect = document.getElementById('ingredient-category');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.displayName;
            option.selected = category.id === selectedCategoryId;
            categorySelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

async function handleEditIngredient(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    const ingredientId = document.getElementById('ingredient-id').value;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mise à jour...';
        
        const ingredientData = {
            name: document.getElementById('ingredient-name').value,
            unit: document.getElementById('ingredient-unit').value,
            categoryId: document.getElementById('ingredient-category').value,
            caloriesPer100g: parseInt(document.getElementById('ingredient-calories').value) || null,
            averageCost: document.getElementById('ingredient-cost').value,
            
            // Régimes alimentaires
            dietaryTags: Array.from(document.querySelectorAll('[id^="diet-"]:checked')).map(cb => cb.value),
            
            // Allergènes
            allergens: Array.from(document.querySelectorAll('[id^="allergen-"]:checked')).map(cb => cb.value),
            
            // Conserver les valeurs existantes
            seasonality: ['year_round'],
            shelfLife: null
        };
        
        // Validation
        if (!ingredientData.name || !ingredientData.unit || !ingredientData.categoryId) {
            throw new Error('Nom, unité et catégorie sont obligatoires');
        }
        
        const updatedIngredient = await api.put(`/ingredients/${ingredientId}`, ingredientData);
        
        showAlert('Ingrédient mis à jour avec succès !', 'success');
        
        // Fermer le modal et recharger les ingrédients
        bootstrap.Modal.getInstance(document.getElementById('recipeModal')).hide();
        await loadIngredients();
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        showAlert(`Erreur: ${error.message}`, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// ========================================
// GESTION DES NOTIFICATIONS
// ========================================

let currentNotifications = [];
let notificationFilters = {
    type: '',
    category: '',
    status: 'all'
};

// Charger les notifications
async function loadNotifications() {
    try {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        container.innerHTML = `
            <div class="loading">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-3">Chargement des notifications...</p>
            </div>
        `;

        // Construire les paramètres de requête
        const params = new URLSearchParams();
        params.append('limit', '50');
        
        if (notificationFilters.type) {
            params.append('type', notificationFilters.type);
        }
        if (notificationFilters.category) {
            params.append('category', notificationFilters.category);
        }
        if (notificationFilters.status === 'unread') {
            params.append('includeRead', 'false');
        }

        // Charger les notifications et les statistiques en parallèle
        const [notificationsResponse, statsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/notifications/me?${params}`, {
                headers: {
                    'Authorization': `Bearer ${getUserToken()}`
                }
            }),
            fetch(`${API_BASE}/api/notifications/me/stats`, {
                headers: {
                    'Authorization': `Bearer ${getUserToken()}`
                }
            })
        ]);

        // Si pas d'authentification, afficher un message informatif
        if (notificationsResponse.status === 401 || statsResponse.status === 401) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-bell fs-1 text-muted"></i>
                    <h5 class="mt-3">Notifications non disponibles</h5>
                    <p class="text-muted">
                        Le système de notifications nécessite une authentification.<br>
                        Connectez-vous en tant qu'administrateur pour tester cette fonctionnalité.
                    </p>
                    <a href="/admin/login.html" class="btn btn-primary">
                        <i class="bi bi-box-arrow-in-right me-1"></i>
                        Connexion Admin
                    </a>
                </div>
            `;
            return;
        }

        if (!notificationsResponse.ok || !statsResponse.ok) {
            throw new Error('Erreur lors du chargement des notifications');
        }

        const notificationsData = await notificationsResponse.json();
        const statsData = await statsResponse.json();

        currentNotifications = notificationsData.notifications || [];
        
        // Mettre à jour les statistiques
        updateNotificationStats(statsData.stats);
        
        // Mettre à jour le badge dans la navigation
        updateNotificationBadge(statsData.stats.unread);
        
        // Afficher les notifications
        displayNotifications(currentNotifications);

    } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
        
        const container = document.getElementById('notifications-list');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    Erreur lors du chargement des notifications: ${error.message}
                    <button class="btn btn-outline-danger btn-sm ms-2" onclick="loadNotifications()">
                        Réessayer
                    </button>
                </div>
            `;
        }
        
        showAlert('Erreur lors du chargement des notifications', 'danger');
    }
}

// Afficher les notifications
function displayNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-bell-slash fs-1 text-muted"></i>
                <p class="text-muted mt-3">Aucune notification trouvée</p>
            </div>
        `;
        return;
    }

    const html = notifications.map(notification => `
        <div class="card notification-item ${!notification.isRead ? 'unread' : ''} mb-3" 
             onclick="handleNotificationClick('${notification.id}')" 
             data-notification-id="${notification.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <h6 class="mb-0 me-2">${escapeHtml(notification.title)}</h6>
                            <span class="badge notification-badge ${notification.type}">${getTypeLabel(notification.type)}</span>
                            <span class="badge bg-secondary ms-1">${getCategoryLabel(notification.category)}</span>
                            ${!notification.isRead ? '<span class="badge bg-warning ms-1">Nouveau</span>' : ''}
                        </div>
                        
                        <div class="notification-content mb-2">
                            <p class="mb-0 text-muted">${escapeHtml(notification.message)}</p>
                        </div>

                        <div class="notification-meta">
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                ${formatNotificationDate(notification.createdAt)}
                                ${notification.url ? `<span class="mx-2">•</span><i class="bi bi-link me-1"></i>Action disponible` : ''}
                                ${notification.expiresAt ? `<span class="mx-2">•</span><i class="bi bi-calendar-x me-1"></i>Expire le ${formatNotificationDate(notification.expiresAt)}` : ''}
                            </small>
                        </div>
                    </div>
                    
                    <div class="notification-actions ms-2">
                        ${!notification.isRead ? `
                            <button class="btn btn-sm btn-outline-success me-1" 
                                    onclick="event.stopPropagation(); markNotificationAsRead('${notification.id}')"
                                    title="Marquer comme lu">
                                <i class="bi bi-check"></i>
                            </button>
                        ` : ''}
                        
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="event.stopPropagation(); deleteNotification('${notification.id}')"
                                title="Supprimer">
                            <i class="bi bi-trash"></i>
                        </button>
                        
                        ${notification.url ? `
                            <button class="btn btn-sm btn-outline-primary ms-1" 
                                    onclick="event.stopPropagation(); handleNotificationAction('${notification.id}', '${notification.url}')"
                                    title="Ouvrir l'action">
                                <i class="bi bi-box-arrow-up-right"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Mettre à jour les statistiques
function updateNotificationStats(stats) {
    const statsContainer = document.getElementById('notificationStats');
    if (!statsContainer) return;

    statsContainer.style.display = 'block';
    
    document.getElementById('totalNotifications').textContent = stats.total || 0;
    document.getElementById('unreadNotifications').textContent = stats.unread || 0;
    document.getElementById('readNotifications').textContent = stats.read || 0;
    document.getElementById('recentNotifications').textContent = stats.recent || 0;

    // Afficher/masquer le bouton "Tout marquer lu"
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        if (stats.unread > 0) {
            markAllBtn.style.display = 'inline-block';
            markAllBtn.textContent = `Tout marquer lu (${stats.unread})`;
        } else {
            markAllBtn.style.display = 'none';
        }
    }
}

// Mettre à jour le badge de notifications
function updateNotificationBadge(unreadCount) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Gérer le clic sur une notification
async function handleNotificationClick(notificationId) {
    try {
        const notification = currentNotifications.find(n => n.id === notificationId);
        if (!notification) return;

        // Marquer comme lue si nécessaire
        if (!notification.isRead) {
            await markNotificationAsRead(notificationId, false);
        }

        // Rediriger si URL fournie
        if (notification.url) {
            if (notification.url.startsWith('http')) {
                window.open(notification.url, '_blank');
            } else {
                // URL relative - redirection interne
                if (notification.url.startsWith('/admin')) {
                    window.open(notification.url, '_blank');
                } else {
                    // Action dans l'app - par exemple basculer vers un onglet
                    handleInternalNotificationAction(notification.url);
                }
            }
        }

    } catch (error) {
        console.error('Erreur lors du traitement de la notification:', error);
        showAlert('Erreur lors du traitement de la notification', 'danger');
    }
}

// Gérer les actions internes de notification
function handleInternalNotificationAction(url) {
    // Exemples d'actions internes
    if (url === '/menus') {
        document.getElementById('menus-tab').click();
    } else if (url === '/recipes') {
        document.getElementById('recipes-tab').click();
    } else if (url === '/shopping') {
        document.getElementById('shopping-tab').click();
    } else if (url === '/ingredients') {
        document.getElementById('ingredients-tab').click();
    }
}

// Marquer une notification comme lue
async function markNotificationAsRead(notificationId, reload = true) {
    try {
        const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getUserToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du marquage comme lu');
        }

        if (reload) {
            showAlert('Notification marquée comme lue', 'success');
            await loadNotifications();
        }

    } catch (error) {
        console.error('Erreur:', error);
        if (reload) {
            showAlert('Erreur lors du marquage comme lu', 'danger');
        }
    }
}

// Marquer toutes les notifications comme lues
async function markAllAsRead() {
    try {
        const response = await fetch(`${API_BASE}/api/notifications/me/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getUserToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du marquage global');
        }

        const result = await response.json();
        showAlert(`${result.message}`, 'success');
        await loadNotifications();

    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors du marquage global comme lu', 'danger');
    }
}

// Supprimer une notification
async function deleteNotification(notificationId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getUserToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        showAlert('Notification supprimée', 'success');
        await loadNotifications();

    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur lors de la suppression', 'danger');
    }
}

// Gérer l'action d'une notification
function handleNotificationAction(notificationId, url) {
    if (url.startsWith('http')) {
        window.open(url, '_blank');
    } else {
        handleInternalNotificationAction(url);
    }
}

// Filtrer les notifications
function filterNotifications() {
    notificationFilters.type = document.getElementById('notificationTypeFilter')?.value || '';
    notificationFilters.category = document.getElementById('notificationCategoryFilter')?.value || '';
    notificationFilters.status = document.getElementById('notificationStatusFilter')?.value || 'all';
    
    loadNotifications();
}

// Fonctions utilitaires pour les notifications
function getTypeLabel(type) {
    const labels = {
        'info': 'Info',
        'success': 'Succès',
        'warning': 'Attention',
        'danger': 'Important'
    };
    return labels[type] || type;
}

function getCategoryLabel(category) {
    const labels = {
        'general': 'Général',
        'menu': 'Menu',
        'recipe': 'Recette',
        'user': 'Compte',
        'system': 'Système'
    };
    return labels[category] || category;
}

function formatNotificationDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
        return `Il y a ${Math.floor(diffInHours)} heure${Math.floor(diffInHours) > 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Fonction pour obtenir le token utilisateur (simulation)
function getUserToken() {
    // Pour l'instant, utiliser un token factice pour les notifications
    // En production, ceci serait un vrai token JWT
    return 'user-demo-token';
}

// Charger les notifications au chargement de l'onglet
document.addEventListener('DOMContentLoaded', function() {
    // Charger les notifications périodiquement
    setInterval(() => {
        const notificationsTab = document.getElementById('notifications-tab');
        if (notificationsTab && notificationsTab.classList.contains('active')) {
            loadNotifications();
        } else {
            // Juste mettre à jour le badge si l'onglet n'est pas actif
            updateNotificationBadgeOnly();
        }
    }, 30000); // Toutes les 30 secondes
});

// Mettre à jour seulement le badge (sans recharger l'interface)
async function updateNotificationBadgeOnly() {
    try {
        const response = await fetch(`${API_BASE}/api/notifications/me/stats`, {
            headers: {
                'Authorization': `Bearer ${getUserToken()}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateNotificationBadge(data.stats.unread);
        } else if (response.status === 401) {
            // Pas d'authentification - masquer le badge
            updateNotificationBadge(0);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du badge:', error);
        // Masquer le badge en cas d'erreur
        updateNotificationBadge(0);
    }
}