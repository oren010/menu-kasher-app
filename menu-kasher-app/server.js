require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { PrismaClient } = require('@prisma/client');
const moment = require('moment');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Import routes d'authentification et de gestion
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const preferencesRoutes = require('./routes/preferences');

// Import middleware de sécurité
const { generalRateLimiter, securityHeaders, requireAuth } = require('./middleware/auth');

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware base
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'https://vibecoder-0ocus-u12869.vm.elestio.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(securityHeaders);
app.use(express.static('public'));
app.use(generalRateLimiter);

// Routes d'authentification et de gestion
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/preferences', preferencesRoutes);

// Utils
const MenuService = require('./services/MenuService');
const ShoppingListService = require('./services/ShoppingListService');
const RecipeService = require('./services/RecipeService');

// Initialize services
const menuService = new MenuService(prisma);
const shoppingListService = new ShoppingListService(prisma);
const recipeService = new RecipeService(prisma);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API Menu Kasher Familial',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      recipes: '/api/recipes',
      menus: '/api/menus',
      ingredients: '/api/ingredients',
      shopping: '/api/shopping-lists',
      users: '/api/users',
      notifications: '/api/notifications'
    },
    authentication: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      me: 'GET /api/auth/me',
      refresh: 'POST /api/auth/refresh-token',
      adminLogin: 'POST /api/auth/admin/login',
      adminMe: 'GET /api/auth/admin/me'
    }
  });
});

// === USER ROUTES NOW HANDLED BY /routes/users.js ===

// === ROUTES CATEGORIES & INGREDIENTS ===
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        ingredients: {
          orderBy: { name: 'asc' }
        }
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories', details: error.message });
  }
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const { category, kosher } = req.query;
    
    const where = {};
    if (category) where.categoryId = category;
    if (kosher !== undefined && kosher === 'true') {
      where.dietaryTags = { has: 'kosher' };
    }
    
    const ingredients = await prisma.ingredient.findMany({
      where,
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des ingrédients', details: error.message });
  }
});

app.post('/api/ingredients', async (req, res) => {
  try {
    const { name, unit, categoryId, dietaryTags = ['kosher'] } = req.body;
    
    const ingredient = await prisma.ingredient.create({
      data: { name, unit, categoryId, dietaryTags },
      include: { category: true }
    });
    
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'ingrédient', details: error.message });
  }
});

// === ROUTES RECIPES ===
app.get('/api/recipes', async (req, res) => {
  try {
    const { mealType, kosher, search } = req.query;
    
    const where = {};
    if (mealType) where.mealType = mealType;
    if (kosher !== undefined && kosher === 'true') {
      where.dietaryTags = { has: 'kosher' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const recipes = await recipeService.getRecipes(where);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des recettes', details: error.message });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await recipeService.getRecipeById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ error: 'Recette non trouvée' });
    }
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la recette', details: error.message });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    const recipe = await recipeService.createRecipe(req.body);
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de la recette', details: error.message });
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await recipeService.updateRecipe(req.params.id, req.body);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la recette', details: error.message });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await recipeService.deleteRecipe(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la recette', details: error.message });
  }
});

// === ROUTES MENUS ===
app.get('/api/menus', async (req, res) => {
  try {
    const { userId, active } = req.query;
    
    const where = {};
    if (userId) where.userId = userId;
    if (active !== undefined) where.isActive = active === 'true';
    
    const menus = await menuService.getMenus(where);
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des menus', details: error.message });
  }
});

app.get('/api/menus/:id', async (req, res) => {
  try {
    const menu = await menuService.getMenuById(req.params.id);
    
    if (!menu) {
      return res.status(404).json({ error: 'Menu non trouvé' });
    }
    
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du menu', details: error.message });
  }
});

app.post('/api/menus', requireAuth, async (req, res) => {
  try {
    const menu = await menuService.createMenu(req.body);
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du menu', details: error.message });
  }
});

app.post('/api/menus/:id/generate', requireAuth, async (req, res) => {
  try {
    const menu = await menuService.generateMenu(req.params.id, req.body);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du menu', details: error.message });
  }
});

app.put('/api/menus/:id/meals/:mealId', requireAuth, async (req, res) => {
  try {
    const meal = await menuService.updateMeal(req.params.mealId, req.body);
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du repas', details: error.message });
  }
});

// === ROUTES SHOPPING LISTS ===
app.get('/api/shopping-lists', async (req, res) => {
  try {
    const { menuId, userId } = req.query;
    
    const where = {};
    if (menuId) where.menuId = menuId;
    if (userId) where.userId = userId;
    
    const shoppingLists = await shoppingListService.getShoppingLists(where);
    res.json(shoppingLists);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des listes de courses', details: error.message });
  }
});

app.get('/api/shopping-lists/:id', async (req, res) => {
  try {
    const shoppingList = await shoppingListService.getShoppingListById(req.params.id);
    
    if (!shoppingList) {
      return res.status(404).json({ error: 'Liste de courses non trouvée' });
    }
    
    res.json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la liste de courses', details: error.message });
  }
});

app.post('/api/shopping-lists/generate', requireAuth, async (req, res) => {
  try {
    const { menuId, userId } = req.body;
    const shoppingList = await shoppingListService.generateFromMenu(menuId, userId);
    res.status(201).json(shoppingList);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération de la liste de courses', details: error.message });
  }
});

app.put('/api/shopping-lists/:id/items/:itemId', requireAuth, async (req, res) => {
  try {
    const item = await shoppingListService.updateItem(req.params.itemId, req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'article', details: error.message });
  }
});

// === ROUTE SETTINGS ===
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await prisma.settings.findMany();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres', details: error.message });
  }
});

// === ROUTE STATISTICS ===
app.get('/api/stats', async (req, res) => {
  try {
    const [recipesCount, menusCount, ingredientsCount] = await Promise.all([
      prisma.recipe.count(),
      prisma.menu.count(),
      prisma.ingredient.count()
    ]);
    
    res.json({
      recipes: recipesCount,
      menus: menusCount,
      ingredients: ingredientsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Menu Kasher démarré sur le port ${PORT}`);
  console.log(`📝 Documentation API: http://localhost:${PORT}/`);
  console.log(`🗄️  Base de données: ${process.env.DATABASE_URL ? 'Connectée' : 'Non configurée'}`);
});