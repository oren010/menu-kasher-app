// Configuration des préférences utilisateur
const API_BASE = window.location.origin;

// État global
let currentUser = null;
let selectedDietaryTags = [];
let selectedAllergens = [];

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🔧 Initialisation de la page des préférences");
    
    // Charger les données utilisateur
    await loadUserData();
    
    // Configurer les événements
    setupEventListeners();
    
    // Initialiser les tooltips
    initializeTooltips();
    
    console.log("✅ Page des préférences initialisée");
});

// Charger les données utilisateur existantes
async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE}/api/users`);
        const users = await response.json();
        
        if (users.length > 0) {
            currentUser = users[0];
            populateForm(currentUser);
        }
    } catch (error) {
        console.error("❌ Erreur lors du chargement des données utilisateur:", error);
        showAlert("Erreur lors du chargement des préférences", "danger");
    }
}

// Remplir le formulaire avec les données existantes
function populateForm(user) {
    // Composition familiale
    document.getElementById('adultsCount').value = user.adultsCount || 2;
    document.getElementById('childrenCount').value = user.childrenCount || 2;
    updateRangeValue('adultsCount', 'adults-value');
    updateRangeValue('childrenCount', 'children-value');

    // Restrictions alimentaires
    selectedDietaryTags = user.dietaryRestrictions || [];
    updateDietaryTags();

    // Allergènes
    selectedAllergens = user.allergens || [];
    updateAllergensDisplay();

    // Ingrédients exclus
    document.getElementById('excludedIngredients').value = (user.excludedIngredients || []).join(', ');

    // Niveau de cuisine
    setActiveSkill(user.cookingSkillLevel || 'intermediate');
    setActiveDifficulty(user.preferredDifficulty || 'medium');
    
    // Repas raffinés
    document.getElementById('weeklyRefinedMeals').value = user.weeklyRefinedMeals || 2;
    updateRangeValue('weeklyRefinedMeals', 'refined-value');

    // Objectifs santé
    if (user.dietGoal) {
        document.getElementById('dietGoal').value = user.dietGoal;
        toggleWeightGoals(true);
        
        if (user.currentWeight) document.getElementById('currentWeight').value = user.currentWeight;
        if (user.targetWeight) document.getElementById('targetWeight').value = user.targetWeight;
        if (user.dailyCalorieTarget) {
            document.getElementById('dailyCalorieTarget').value = user.dailyCalorieTarget;
            updateRangeValue('dailyCalorieTarget', 'calories-value');
        }
    }

    // Préférences des repas
    document.getElementById('includeLunch').checked = user.includeLunch !== false;
    document.getElementById('includeDinner').checked = user.includeDinner !== false;
    document.getElementById('includeAdultMeals').checked = user.includeAdultMeals !== false;
    document.getElementById('includeChildMeals').checked = user.includeChildMeals !== false;

    // Budget
    setActiveBudget(user.budgetLevel || 'medium');

    // Mettre à jour les recommandations caloriques
    updateCalorieRecommendation();
}

// Configuration des événements
function setupEventListeners() {
    // Ranges avec mise à jour en temps réel
    const ranges = ['adultsCount', 'childrenCount', 'weeklyRefinedMeals', 'dailyCalorieTarget'];
    ranges.forEach(id => {
        const element = document.getElementById(id);
        const valueId = id.replace('Count', '-value').replace('weekly', '').replace('daily', '').replace('Target', '-value').toLowerCase();
        element.addEventListener('input', () => updateRangeValue(id, valueId));
    });

    // Tags alimentaires
    document.querySelectorAll('.dietary-tags .dietary-tag').forEach(tag => {
        tag.addEventListener('click', () => toggleDietaryTag(tag));
    });

    // Tags allergènes
    document.querySelectorAll('#allergens-tags .dietary-tag').forEach(tag => {
        tag.addEventListener('click', () => toggleAllergen(tag));
    });

    // Sélecteurs de compétences
    document.querySelectorAll('.skill-option[data-skill]').forEach(option => {
        option.addEventListener('click', () => selectSkill(option));
    });

    document.querySelectorAll('.skill-option[data-difficulty]').forEach(option => {
        option.addEventListener('click', () => selectDifficulty(option));
    });

    document.querySelectorAll('.skill-option[data-budget]').forEach(option => {
        option.addEventListener('click', () => selectBudget(option));
    });

    // Objectif de régime
    document.getElementById('dietGoal').addEventListener('change', (e) => {
        toggleWeightGoals(e.target.value !== '');
        updateCalorieRecommendation();
    });

    // Poids pour recommandations
    ['currentWeight', 'targetWeight'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateCalorieRecommendation);
    });

    // Soumission du formulaire
    document.getElementById('preferences-form').addEventListener('submit', handleFormSubmit);
}

// Gestion des ranges
function updateRangeValue(rangeId, valueId) {
    const range = document.getElementById(rangeId);
    const valueSpan = document.getElementById(valueId);
    
    if (range && valueSpan) {
        let displayValue = range.value;
        
        // Formatage spécial pour les calories
        if (rangeId === 'dailyCalorieTarget') {
            displayValue = `${range.value} kcal`;
        }
        
        valueSpan.textContent = displayValue;
        
        // Mettre à jour les recommandations caloriques si nécessaire
        if (rangeId === 'dailyCalorieTarget') {
            updateCalorieRecommendation();
        }
    }
}

// Gestion des tags alimentaires
function toggleDietaryTag(tag) {
    const tagValue = tag.dataset.tag;
    
    if (tag.classList.contains('active')) {
        tag.classList.remove('active');
        selectedDietaryTags = selectedDietaryTags.filter(t => t !== tagValue);
    } else {
        tag.classList.add('active');
        if (!selectedDietaryTags.includes(tagValue)) {
            selectedDietaryTags.push(tagValue);
        }
    }
}

function updateDietaryTags() {
    document.querySelectorAll('.dietary-tags .dietary-tag').forEach(tag => {
        const tagValue = tag.dataset.tag;
        if (selectedDietaryTags.includes(tagValue)) {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });
}

// Gestion des allergènes
function toggleAllergen(tag) {
    const allergen = tag.dataset.allergen;
    
    if (tag.classList.contains('active')) {
        tag.classList.remove('active');
        selectedAllergens = selectedAllergens.filter(a => a !== allergen);
    } else {
        tag.classList.add('active');
        if (!selectedAllergens.includes(allergen)) {
            selectedAllergens.push(allergen);
        }
    }
}

function updateAllergensDisplay() {
    document.querySelectorAll('#allergens-tags .dietary-tag').forEach(tag => {
        const allergen = tag.dataset.allergen;
        if (selectedAllergens.includes(allergen)) {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });
}

// Gestion des sélecteurs de compétences
function selectSkill(clickedOption) {
    document.querySelectorAll('.skill-option[data-skill]').forEach(option => {
        option.classList.remove('active');
    });
    clickedOption.classList.add('active');
}

function setActiveSkill(skillLevel) {
    document.querySelectorAll('.skill-option[data-skill]').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.skill === skillLevel) {
            option.classList.add('active');
        }
    });
}

function selectDifficulty(clickedOption) {
    document.querySelectorAll('.skill-option[data-difficulty]').forEach(option => {
        option.classList.remove('active');
    });
    clickedOption.classList.add('active');
}

function setActiveDifficulty(difficulty) {
    document.querySelectorAll('.skill-option[data-difficulty]').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.difficulty === difficulty) {
            option.classList.add('active');
        }
    });
}

function selectBudget(clickedOption) {
    document.querySelectorAll('.skill-option[data-budget]').forEach(option => {
        option.classList.remove('active');
    });
    clickedOption.classList.add('active');
}

function setActiveBudget(budget) {
    document.querySelectorAll('.skill-option[data-budget]').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.budget === budget) {
            option.classList.add('active');
        }
    });
}

// Gestion des objectifs de poids
function toggleWeightGoals(show) {
    const weightGoals = document.getElementById('weight-goals');
    if (show) {
        weightGoals.style.display = 'block';
    } else {
        weightGoals.style.display = 'none';
    }
}

// Recommandations caloriques
function updateCalorieRecommendation() {
    const currentWeight = parseFloat(document.getElementById('currentWeight').value) || 70;
    const targetWeight = parseFloat(document.getElementById('targetWeight').value) || 70;
    const dailyCalories = parseInt(document.getElementById('dailyCalorieTarget').value) || 2000;
    const dietGoal = document.getElementById('dietGoal').value;
    
    let recommendation = "2000 calories/jour pour maintenir le poids";
    
    if (dietGoal) {
        switch (dietGoal) {
            case 'weight_loss':
                const deficitCalories = Math.max(1200, Math.round(currentWeight * 22 - 500));
                recommendation = `${deficitCalories} calories/jour recommandées pour perdre du poids (déficit de 500 kcal)`;
                break;
            case 'weight_gain':
                const surplusCalories = Math.round(currentWeight * 25 + 300);
                recommendation = `${surplusCalories} calories/jour recommandées pour prendre du poids (surplus de 300 kcal)`;
                break;
            case 'muscle_gain':
                const muscleCalories = Math.round(currentWeight * 28);
                recommendation = `${muscleCalories} calories/jour recommandées pour la prise de muscle`;
                break;
            case 'maintain':
                const maintainCalories = Math.round(currentWeight * 24);
                recommendation = `${maintainCalories} calories/jour pour maintenir votre poids`;
                break;
        }
    }
    
    document.getElementById('calorie-rec-text').textContent = recommendation;
}

// Collecte des données du formulaire
function collectFormData() {
    // Récupérer les compétences sélectionnées
    const selectedSkill = document.querySelector('.skill-option[data-skill].active')?.dataset.skill || 'intermediate';
    const selectedDifficulty = document.querySelector('.skill-option[data-difficulty].active')?.dataset.difficulty || 'medium';
    const selectedBudget = document.querySelector('.skill-option[data-budget].active')?.dataset.budget || 'medium';
    
    // Traiter les ingrédients exclus
    const excludedIngredientsText = document.getElementById('excludedIngredients').value.trim();
    const excludedIngredients = excludedIngredientsText ? 
        excludedIngredientsText.split(',').map(item => item.trim()).filter(item => item) : [];
    
    return {
        adultsCount: parseInt(document.getElementById('adultsCount').value),
        childrenCount: parseInt(document.getElementById('childrenCount').value),
        dietaryRestrictions: selectedDietaryTags,
        allergens: selectedAllergens,
        excludedIngredients: excludedIngredients,
        includeLunch: document.getElementById('includeLunch').checked,
        includeDinner: document.getElementById('includeDinner').checked,
        includeAdultMeals: document.getElementById('includeAdultMeals').checked,
        includeChildMeals: document.getElementById('includeChildMeals').checked,
        cookingSkillLevel: selectedSkill,
        preferredDifficulty: selectedDifficulty,
        weeklyRefinedMeals: parseInt(document.getElementById('weeklyRefinedMeals').value),
        budgetLevel: selectedBudget,
        dietGoal: document.getElementById('dietGoal').value || null,
        currentWeight: parseFloat(document.getElementById('currentWeight').value) || null,
        targetWeight: parseFloat(document.getElementById('targetWeight').value) || null,
        dailyCalorieTarget: parseInt(document.getElementById('dailyCalorieTarget').value) || null
    };
}

// Soumission du formulaire
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // Désactiver le bouton et afficher le loading
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Sauvegarde en cours...';
        
        const formData = collectFormData();
        
        // Envoyer les données
        const response = await fetch(`${API_BASE}/api/users/${currentUser.id}/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const updatedUser = await response.json();
        currentUser = updatedUser;
        
        showAlert("✅ Préférences sauvegardées avec succès !", "success");
        
        // Optionnel: rediriger vers la page principale après 2 secondes
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        
    } catch (error) {
        console.error("❌ Erreur lors de la sauvegarde:", error);
        showAlert("❌ Erreur lors de la sauvegarde des préférences", "danger");
    } finally {
        // Réactiver le bouton
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Affichage des alertes
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-masquer après 5 secondes pour les succès
    if (type === 'success') {
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    // Scroll vers le haut pour voir l'alerte
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialiser les tooltips Bootstrap
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}