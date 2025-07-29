const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Créer les catégories d'ingrédients
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'fruits_legumes' },
      update: {},
      create: { name: 'fruits_legumes', displayName: 'Fruits & Légumes', orderIndex: 1 }
    }),
    prisma.category.upsert({
      where: { name: 'viandes_poissons' },
      update: {},
      create: { name: 'viandes_poissons', displayName: 'Viandes & Poissons', orderIndex: 2 }
    }),
    prisma.category.upsert({
      where: { name: 'produits_laitiers' },
      update: {},
      create: { name: 'produits_laitiers', displayName: 'Produits Laitiers', orderIndex: 3 }
    }),
    prisma.category.upsert({
      where: { name: 'cereales_feculents' },
      update: {},
      create: { name: 'cereales_feculents', displayName: 'Céréales & Féculents', orderIndex: 4 }
    }),
    prisma.category.upsert({
      where: { name: 'epices_condiments' },
      update: {},
      create: { name: 'epices_condiments', displayName: 'Épices & Condiments', orderIndex: 5 }
    }),
    prisma.category.upsert({
      where: { name: 'produits_secs' },
      update: {},
      create: { name: 'produits_secs', displayName: 'Produits Secs', orderIndex: 6 }
    }),
    prisma.category.upsert({
      where: { name: 'boissons' },
      update: {},
      create: { name: 'boissons', displayName: 'Boissons', orderIndex: 7 }
    })
  ]);

  console.log('✅ Catégories créées:', categories.length);

  // Créer des ingrédients de base kasher
  const ingredients = [
    // Fruits & Légumes
    { name: 'Pommes', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Bananes', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Carottes', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Pommes de terre', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Oignons', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Tomates', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Courgettes', unit: 'kg', categoryName: 'fruits_legumes' },
    { name: 'Épinards', unit: 'g', categoryName: 'fruits_legumes' },
    
    // Viandes & Poissons (kasher)
    { name: 'Poulet kasher', unit: 'kg', categoryName: 'viandes_poissons' },
    { name: 'Bœuf kasher', unit: 'kg', categoryName: 'viandes_poissons' },
    { name: 'Saumon', unit: 'kg', categoryName: 'viandes_poissons' },
    { name: 'Thon', unit: 'g', categoryName: 'viandes_poissons' },
    
    // Produits laitiers (kasher)
    { name: 'Lait', unit: 'l', categoryName: 'produits_laitiers' },
    { name: 'Yaourt nature', unit: 'g', categoryName: 'produits_laitiers' },
    { name: 'Fromage blanc', unit: 'g', categoryName: 'produits_laitiers' },
    { name: 'Beurre', unit: 'g', categoryName: 'produits_laitiers' },
    { name: 'Œufs', unit: 'piece', categoryName: 'produits_laitiers' },
    
    // Céréales & Féculents
    { name: 'Riz basmati', unit: 'kg', categoryName: 'cereales_feculents' },
    { name: 'Pâtes', unit: 'g', categoryName: 'cereales_feculents' },
    { name: 'Pain', unit: 'piece', categoryName: 'cereales_feculents' },
    { name: 'Farine', unit: 'kg', categoryName: 'cereales_feculents' },
    { name: 'Quinoa', unit: 'g', categoryName: 'cereales_feculents' },
    
    // Épices & Condiments
    { name: 'Sel', unit: 'g', categoryName: 'epices_condiments' },
    { name: 'Poivre noir', unit: 'g', categoryName: 'epices_condiments' },
    { name: 'Huile d\'olive', unit: 'ml', categoryName: 'epices_condiments' },
    { name: 'Ail', unit: 'piece', categoryName: 'epices_condiments' },
    { name: 'Persil', unit: 'bunch', categoryName: 'epices_condiments' },
    { name: 'Cumin', unit: 'g', categoryName: 'epices_condiments' },
    { name: 'Paprika', unit: 'g', categoryName: 'epices_condiments' },
    
    // Produits secs
    { name: 'Lentilles', unit: 'g', categoryName: 'produits_secs' },
    { name: 'Pois chiches', unit: 'g', categoryName: 'produits_secs' },
    { name: 'Amandes', unit: 'g', categoryName: 'produits_secs' },
    { name: 'Raisins secs', unit: 'g', categoryName: 'produits_secs' },
    
    // Boissons
    { name: 'Eau', unit: 'l', categoryName: 'boissons' },
    { name: 'Jus d\'orange', unit: 'l', categoryName: 'boissons' },
    { name: 'Thé', unit: 'g', categoryName: 'boissons' }
  ];

  for (const ingredient of ingredients) {
    const category = categories.find(cat => cat.name === ingredient.categoryName);
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: {
        name: ingredient.name,
        unit: ingredient.unit,
        categoryId: category.id,
        dietaryTags: ['kosher']
      }
    });
  }

  console.log('✅ Ingrédients créés:', ingredients.length);

  // Créer un utilisateur par défaut
  const defaultUser = await prisma.user.upsert({
    where: { email: 'famille@menu-kasher.app' },
    update: {},
    create: {
      email: 'famille@menu-kasher.app',
      name: 'Famille Kasher',
      familySize: 4,
      childrenCount: 2,
      kosherLevel: 'strict',
      allergies: [],
      preferences: ['pas_de_tofu']
    }
  });

  console.log('✅ Utilisateur par défaut créé:', defaultUser.name);

  // Créer quelques recettes de base kasher
  const recettes = [
    {
      name: 'Sandwich au thon',
      description: 'Simple sandwich pour le déjeuner des enfants',
      servings: 2,
      prepTime: 10,
      mealType: 'lunch_children',
      instructions: [
        'Ouvrir la boîte de thon et l\'égoutter',
        'Mélanger le thon avec un peu d\'huile d\'olive',
        'Tartiner sur le pain',
        'Ajouter des rondelles de tomates'
      ],
      ingredients: [
        { name: 'Thon', quantity: 200, unit: 'g' },
        { name: 'Pain', quantity: 4, unit: 'piece' },
        { name: 'Tomates', quantity: 0.2, unit: 'kg' },
        { name: 'Huile d\'olive', quantity: 10, unit: 'ml' }
      ]
    },
    {
      name: 'Pâtes au beurre',
      description: 'Plat simple et rapide pour les enfants',
      servings: 2,
      prepTime: 15,
      cookTime: 10,
      mealType: 'dinner_children',
      instructions: [
        'Faire cuire les pâtes dans de l\'eau bouillante salée',
        'Égoutter les pâtes',
        'Ajouter le beurre et mélanger',
        'Servir chaud'
      ],
      ingredients: [
        { name: 'Pâtes', quantity: 200, unit: 'g' },
        { name: 'Beurre', quantity: 30, unit: 'g' },
        { name: 'Sel', quantity: 5, unit: 'g' }
      ]
    },
    {
      name: 'Saumon grillé aux légumes',
      description: 'Plat équilibré et savoureux pour les adultes',
      servings: 4,
      prepTime: 20,
      cookTime: 25,
      mealType: 'dinner_adults',
      suggestedDrink: 'Vin blanc sec kasher',
      instructions: [
        'Préchauffer le four à 200°C',
        'Couper les légumes en dés',
        'Assaisonner le saumon avec sel, poivre et huile d\'olive',
        'Cuire le saumon et les légumes au four pendant 20-25 minutes'
      ],
      ingredients: [
        { name: 'Saumon', quantity: 0.8, unit: 'kg' },
        { name: 'Courgettes', quantity: 0.5, unit: 'kg' },
        { name: 'Tomates', quantity: 0.3, unit: 'kg' },
        { name: 'Huile d\'olive', quantity: 30, unit: 'ml' },
        { name: 'Sel', quantity: 5, unit: 'g' },
        { name: 'Poivre noir', quantity: 2, unit: 'g' }
      ]
    }
  ];

  for (const recette of recettes) {
    const createdRecipe = await prisma.recipe.create({
      data: {
        name: recette.name,
        description: recette.description,
        servings: recette.servings,
        prepTime: recette.prepTime,
        cookTime: recette.cookTime || null,
        mealType: recette.mealType,
        suggestedDrink: recette.suggestedDrink || null,
        instructions: recette.instructions,
        dietaryTags: ['kosher']
      }
    });

    // Ajouter les ingrédients à la recette
    for (const ing of recette.ingredients) {
      const ingredient = await prisma.ingredient.findUnique({
        where: { name: ing.name }
      });
      
      if (ingredient) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId: createdRecipe.id,
            ingredientId: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit
          }
        });
      }
    }
  }

  console.log('✅ Recettes créées:', recettes.length);

  // Créer des paramètres par défaut
  const settings = [
    { key: 'default_family_size', value: '4', description: 'Taille par défaut de la famille' },
    { key: 'default_children_count', value: '2', description: 'Nombre d\'enfants par défaut' },
    { key: 'kosher_level', value: 'strict', description: 'Niveau de kasher par défaut' },
    { key: 'menu_duration_days', value: '14', description: 'Durée par défaut d\'un menu en jours' }
  ];

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log('✅ Paramètres créés:', settings.length);

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });