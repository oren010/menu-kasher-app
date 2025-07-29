require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Données de démonstration en mémoire
let demoData = {
  users: [
    {
      id: '1',
      email: 'famille@menu-kasher.app',
      name: 'Famille Kasher',
      familySize: 4,
      childrenCount: 2,
      kosherLevel: 'strict',
      allergies: [],
      preferences: ['pas_de_tofu']
    }
  ],
  categories: [
    { id: '1', name: 'fruits_legumes', displayName: 'Fruits & Légumes', orderIndex: 1 },
    { id: '2', name: 'viandes_poissons', displayName: 'Viandes & Poissons', orderIndex: 2 },
    { id: '3', name: 'produits_laitiers', displayName: 'Produits Laitiers', orderIndex: 3 },
    { id: '4', name: 'cereales_feculents', displayName: 'Céréales & Féculents', orderIndex: 4 },
    { id: '5', name: 'epices_condiments', displayName: 'Épices & Condiments', orderIndex: 5 }
  ],
  ingredients: [
    { id: '1', name: 'Pommes', unit: 'kg', categoryId: '1', isKosher: true },
    { id: '2', name: 'Carottes', unit: 'kg', categoryId: '1', isKosher: true },
    { id: '3', name: 'Poulet kasher', unit: 'kg', categoryId: '2', isKosher: true },
    { id: '4', name: 'Saumon', unit: 'kg', categoryId: '2', isKosher: true },
    { id: '5', name: 'Lait', unit: 'l', categoryId: '3', isKosher: true },
    { id: '6', name: 'Œufs', unit: 'piece', categoryId: '3', isKosher: true },
    { id: '7', name: 'Riz basmati', unit: 'kg', categoryId: '4', isKosher: true },
    { id: '8', name: 'Pâtes', unit: 'g', categoryId: '4', isKosher: true },
    { id: '9', name: 'Sel', unit: 'g', categoryId: '5', isKosher: true },
    { id: '10', name: 'Huile d\'olive', unit: 'ml', categoryId: '5', isKosher: true }
  ],
  recipes: [
    {
      id: '1',
      name: 'Sandwich au thon',
      description: 'Simple sandwich pour le déjeuner des enfants',
      servings: 2,
      prepTime: 10,
      mealType: 'lunch_children',
      instructions: ['Ouvrir la boîte de thon', 'Mélanger avec huile d\'olive', 'Tartiner sur pain'],
      ingredients: [
        { ingredientId: '4', ingredient: { id: '4', name: 'Thon', unit: 'g' }, quantity: 200, unit: 'g' },
        { ingredientId: '10', ingredient: { id: '10', name: 'Huile d\'olive', unit: 'ml' }, quantity: 10, unit: 'ml' }
      ],
      isKosher: true,
      _count: { meals: 3 }
    },
    {
      id: '2',
      name: 'Pâtes au beurre',
      description: 'Plat simple et rapide pour les enfants',
      servings: 2,
      prepTime: 15,
      cookTime: 10,
      mealType: 'dinner_children',
      instructions: ['Faire cuire les pâtes', 'Ajouter le beurre', 'Servir chaud'],
      ingredients: [
        { ingredientId: '8', ingredient: { id: '8', name: 'Pâtes', unit: 'g' }, quantity: 200, unit: 'g' }
      ],
      isKosher: true,
      _count: { meals: 5 }
    },
    {
      id: '3',
      name: 'Saumon grillé aux légumes',
      description: 'Plat équilibré et savoureux pour les adultes',
      servings: 4,
      prepTime: 20,
      cookTime: 25,
      mealType: 'dinner_adults',
      suggestedDrink: 'Vin blanc sec kasher',
      instructions: ['Préchauffer le four', 'Couper les légumes', 'Cuire 25 minutes'],
      ingredients: [
        { ingredientId: '4', ingredient: { id: '4', name: 'Saumon', unit: 'kg' }, quantity: 0.8, unit: 'kg' },
        { ingredientId: '2', ingredient: { id: '2', name: 'Carottes', unit: 'kg' }, quantity: 0.3, unit: 'kg' }
      ],
      isKosher: true,
      _count: { meals: 2 }
    }
  ],
  menus: [
    {
      id: '1',
      name: 'Menu Semaine 1',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      userId: '1',
      isActive: true,
      user: { id: '1', name: 'Famille Kasher', familySize: 4, childrenCount: 2 },
      meals: [],
      _count: { meals: 6, shoppingLists: 1 }
    }
  ],
  shoppingLists: [
    {
      id: '1',
      name: 'Liste de courses - Menu Semaine 1',
      menuId: '1',
      userId: '1',
      createdAt: new Date().toISOString(),
      menu: { id: '1', name: 'Menu Semaine 1' },
      user: { id: '1', name: 'Famille Kasher' },
      items: [
        {
          id: '1',
          ingredientId: '4',
          ingredient: { id: '4', name: 'Saumon', category: { displayName: 'Viandes & Poissons' } },
          quantity: 0.8,
          unit: 'kg',
          isPurchased: false
        },
        {
          id: '2',
          ingredientId: '8',
          ingredient: { id: '8', name: 'Pâtes', category: { displayName: 'Céréales & Féculents' } },
          quantity: 400,
          unit: 'g',
          isPurchased: false
        }
      ],
      _count: { items: 2 }
    }
  ]
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'API Menu Kasher Familial - Version Démo',
    version: '1.0.0',
    status: 'Démo fonctionnelle sans base de données',
    endpoints: {
      recipes: '/api/recipes',
      menus: '/api/menus',
      ingredients: '/api/ingredients',
      shopping: '/api/shopping-lists',
      users: '/api/users'
    }
  });
});

// Users
app.get('/api/users', (req, res) => {
  res.json(demoData.users);
});

app.get('/api/users/:id', (req, res) => {
  const user = demoData.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ ...user, menus: demoData.menus.filter(m => m.userId === user.id) });
});

// Categories & Ingredients
app.get('/api/categories', (req, res) => {
  const categoriesWithIngredients = demoData.categories.map(cat => ({
    ...cat,
    ingredients: demoData.ingredients.filter(ing => ing.categoryId === cat.id)
  }));
  res.json(categoriesWithIngredients);
});

app.get('/api/ingredients', (req, res) => {
  const { category, kosher } = req.query;
  let filtered = demoData.ingredients;
  
  if (category) filtered = filtered.filter(ing => ing.categoryId === category);
  if (kosher !== undefined) filtered = filtered.filter(ing => ing.isKosher === (kosher === 'true'));
  
  const withCategory = filtered.map(ing => ({
    ...ing,
    category: demoData.categories.find(cat => cat.id === ing.categoryId)
  }));
  
  res.json(withCategory);
});

app.post('/api/ingredients', (req, res) => {
  const { name, unit, categoryId, isKosher = true } = req.body;
  const newIngredient = {
    id: String(demoData.ingredients.length + 1),
    name,
    unit,
    categoryId,
    isKosher,
    category: demoData.categories.find(cat => cat.id === categoryId)
  };
  demoData.ingredients.push(newIngredient);
  res.status(201).json(newIngredient);
});

// Recipes
app.get('/api/recipes', (req, res) => {
  const { mealType, kosher, search } = req.query;
  let filtered = demoData.recipes;
  
  if (mealType) filtered = filtered.filter(r => r.mealType === mealType);
  if (kosher !== undefined) filtered = filtered.filter(r => r.isKosher === (kosher === 'true'));
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(searchLower) ||
      (r.description && r.description.toLowerCase().includes(searchLower))
    );
  }
  
  res.json(filtered);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = demoData.recipes.find(r => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recette non trouvée' });
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const newRecipe = {
    id: String(demoData.recipes.length + 1),
    ...req.body,
    isKosher: true,
    _count: { meals: 0 }
  };
  demoData.recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

// Menus
app.get('/api/menus', (req, res) => {
  const { userId, active } = req.query;
  let filtered = demoData.menus;
  
  if (userId) filtered = filtered.filter(m => m.userId === userId);
  if (active !== undefined) filtered = filtered.filter(m => m.isActive === (active === 'true'));
  
  res.json(filtered);
});

app.get('/api/menus/:id', (req, res) => {
  const menu = demoData.menus.find(m => m.id === req.params.id);
  if (!menu) return res.status(404).json({ error: 'Menu non trouvé' });
  
  // Générer quelques repas de démonstration
  const demoMeals = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Déjeuner enfants
    demoMeals.push({
      id: `meal-${i}-lunch`,
      date: date.toISOString(),
      mealType: 'lunch_children',
      recipe: demoData.recipes.find(r => r.mealType === 'lunch_children'),
      menuId: menu.id
    });
    
    // Dîner enfants
    demoMeals.push({
      id: `meal-${i}-dinner-children`,
      date: date.toISOString(),
      mealType: 'dinner_children',
      recipe: demoData.recipes.find(r => r.mealType === 'dinner_children'),
      menuId: menu.id
    });
    
    // Dîner adultes
    demoMeals.push({
      id: `meal-${i}-dinner-adults`,
      date: date.toISOString(),
      mealType: 'dinner_adults',
      recipe: demoData.recipes.find(r => r.mealType === 'dinner_adults'),
      menuId: menu.id
    });
  }
  
  res.json({
    ...menu,
    meals: demoMeals,
    shoppingLists: demoData.shoppingLists.filter(sl => sl.menuId === menu.id)
  });
});

app.post('/api/menus', (req, res) => {
  const { name, startDate, userId } = req.body;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);
  
  // Désactiver les autres menus
  demoData.menus.forEach(m => {
    if (m.userId === userId) m.isActive = false;
  });
  
  const newMenu = {
    id: String(demoData.menus.length + 1),
    name,
    startDate,
    endDate: endDate.toISOString(),
    userId,
    isActive: true,
    user: demoData.users.find(u => u.id === userId),
    meals: [],
    _count: { meals: 0, shoppingLists: 0 }
  };
  
  demoData.menus.push(newMenu);
  res.status(201).json(newMenu);
});

app.post('/api/menus/:id/generate', (req, res) => {
  const menu = demoData.menus.find(m => m.id === req.params.id);
  if (!menu) return res.status(404).json({ error: 'Menu non trouvé' });
  
  // Simuler la génération de menu
  setTimeout(() => {
    menu._count.meals = 21; // 7 jours × 3 repas
    res.json(menu);
  }, 1000);
});

// Shopping Lists
app.get('/api/shopping-lists', (req, res) => {
  const { menuId, userId } = req.query;
  let filtered = demoData.shoppingLists;
  
  if (menuId) filtered = filtered.filter(sl => sl.menuId === menuId);
  if (userId) filtered = filtered.filter(sl => sl.userId === userId);
  
  res.json(filtered);
});

app.get('/api/shopping-lists/:id', (req, res) => {
  const shoppingList = demoData.shoppingLists.find(sl => sl.id === req.params.id);
  if (!shoppingList) return res.status(404).json({ error: 'Liste de courses non trouvée' });
  res.json(shoppingList);
});

app.post('/api/shopping-lists/generate', (req, res) => {
  const { menuId, userId } = req.body;
  const menu = demoData.menus.find(m => m.id === menuId);
  if (!menu) return res.status(400).json({ error: 'Menu non trouvé' });
  
  const newShoppingList = {
    id: String(demoData.shoppingLists.length + 1),
    name: `Liste de courses - ${menu.name}`,
    menuId,
    userId,
    createdAt: new Date().toISOString(),
    menu: { id: menu.id, name: menu.name },
    user: demoData.users.find(u => u.id === userId),
    items: demoData.shoppingLists[0].items, // Réutiliser les articles de démo
    _count: { items: 2 }
  };
  
  demoData.shoppingLists.push(newShoppingList);
  res.status(201).json(newShoppingList);
});

// Stats
app.get('/api/stats', (req, res) => {
  res.json({
    recipes: demoData.recipes.length,
    menus: demoData.menus.length,
    ingredients: demoData.ingredients.length
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Menu Kasher (Démo) démarré sur le port ${PORT}`);
  console.log(`📝 Application accessible: http://localhost:${PORT}/`);
  console.log(`🗄️  Mode: Version démo avec données en mémoire`);
  console.log(`✅ Toutes les fonctionnalités de base sont opérationnelles`);
});