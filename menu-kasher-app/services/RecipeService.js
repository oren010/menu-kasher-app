class RecipeService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getRecipes(where = {}) {
    return await this.prisma.recipe.findMany({
      where,
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: {
                category: true
              }
            }
          },
          orderBy: { ingredient: { name: 'asc' } }
        },
        _count: {
          select: { meals: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getRecipeById(id) {
    return await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: {
                category: true
              }
            }
          },
          orderBy: { ingredient: { name: 'asc' } }
        },
        meals: {
          include: {
            menu: {
              select: { id: true, name: true, startDate: true }
            }
          },
          orderBy: { date: 'desc' },
          take: 10 // Dernières utilisations
        }
      }
    });
  }

  async createRecipe({
    name,
    description,
    servings = 4,
    prepTime,
    cookTime,
    difficulty = 'medium',
    mealType,
    audience = 'both',
    cuisine,
    caloriesPerServing,
    proteinPerServing,
    carbsPerServing,
    fatPerServing,
    instructions = [],
    tips = [],
    suggestedDrink,
    suggestedSides = [],
    equipment = [],
    dietaryTags = ['kosher'],
    mealTags = [],
    occasionTags = [],
    allergens = [],
    personalNotes,
    isTested = false,
    isBookmarked = false,
    canMakeAhead = false,
    freezable = false,
    leftoverDays,
    ingredients = []
  }) {
    // Créer la recette
    const recipe = await this.prisma.recipe.create({
      data: {
        name,
        description,
        servings,
        prepTime,
        cookTime,
        totalTime: prepTime && cookTime ? prepTime + cookTime : null,
        difficulty,
        mealType,
        audience,
        cuisine,
        caloriesPerServing,
        proteinPerServing,
        carbsPerServing,
        fatPerServing,
        instructions,
        tips,
        suggestedDrink,
        suggestedSides,
        equipment,
        dietaryTags,
        mealTags,
        occasionTags,
        allergens,
        personalNotes,
        isTested,
        isBookmarked,
        canMakeAhead,
        freezable,
        leftoverDays
      }
    });

    // Ajouter les ingrédients
    if (ingredients.length > 0) {
      const recipeIngredients = ingredients.map(ing => ({
        recipeId: recipe.id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes
      }));

      await this.prisma.recipeIngredient.createMany({
        data: recipeIngredients
      });
    }

    return await this.getRecipeById(recipe.id);
  }

  async updateRecipe(id, updateData) {
    const { ingredients, ...recipeData } = updateData;

    // Mettre à jour la recette
    const recipe = await this.prisma.recipe.update({
      where: { id },
      data: recipeData
    });

    // Mettre à jour les ingrédients si fournis
    if (ingredients) {
      // Supprimer les anciens ingrédients
      await this.prisma.recipeIngredient.deleteMany({
        where: { recipeId: id }
      });

      // Ajouter les nouveaux ingrédients
      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map(ing => ({
          recipeId: id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        }));

        await this.prisma.recipeIngredient.createMany({
          data: recipeIngredients
        });
      }
    }

    return await this.getRecipeById(id);
  }

  async deleteRecipe(id) {
    // Vérifier si la recette est utilisée dans des menus
    const mealsUsingRecipe = await this.prisma.meal.count({
      where: { recipeId: id }
    });

    if (mealsUsingRecipe > 0) {
      throw new Error(`Cette recette ne peut pas être supprimée car elle est utilisée dans ${mealsUsingRecipe} repas`);
    }

    // Supprimer la recette (les ingrédients seront supprimés en cascade)
    return await this.prisma.recipe.delete({
      where: { id }
    });
  }

  async duplicateRecipe(id, newName) {
    const originalRecipe = await this.getRecipeById(id);
    if (!originalRecipe) throw new Error('Recette originale non trouvée');

    // Créer la nouvelle recette
    const newRecipe = await this.prisma.recipe.create({
      data: {
        name: newName,
        description: originalRecipe.description,
        servings: originalRecipe.servings,
        prepTime: originalRecipe.prepTime,
        cookTime: originalRecipe.cookTime,
        totalTime: originalRecipe.totalTime,
        difficulty: originalRecipe.difficulty,
        mealType: originalRecipe.mealType,
        audience: originalRecipe.audience,
        cuisine: originalRecipe.cuisine,
        caloriesPerServing: originalRecipe.caloriesPerServing,
        proteinPerServing: originalRecipe.proteinPerServing,
        carbsPerServing: originalRecipe.carbsPerServing,
        fatPerServing: originalRecipe.fatPerServing,
        instructions: originalRecipe.instructions,
        tips: originalRecipe.tips,
        suggestedDrink: originalRecipe.suggestedDrink,
        suggestedSides: originalRecipe.suggestedSides,
        equipment: originalRecipe.equipment,
        dietaryTags: originalRecipe.dietaryTags,
        mealTags: originalRecipe.mealTags,
        occasionTags: originalRecipe.occasionTags,
        allergens: originalRecipe.allergens,
        personalNotes: originalRecipe.personalNotes,
        isTested: originalRecipe.isTested,
        isBookmarked: false, // Reset bookmark for duplicated recipe
        canMakeAhead: originalRecipe.canMakeAhead,
        freezable: originalRecipe.freezable,
        leftoverDays: originalRecipe.leftoverDays
      }
    });

    // Copier les ingrédients
    if (originalRecipe.ingredients.length > 0) {
      const recipeIngredients = originalRecipe.ingredients.map(ing => ({
        recipeId: newRecipe.id,
        ingredientId: ing.ingredient.id,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes
      }));

      await this.prisma.recipeIngredient.createMany({
        data: recipeIngredients
      });
    }

    return await this.getRecipeById(newRecipe.id);
  }

  async scaleRecipe(id, newServings) {
    const recipe = await this.getRecipeById(id);
    if (!recipe) throw new Error('Recette non trouvée');

    const scaleFactor = newServings / recipe.servings;

    // Calculer les nouvelles quantités
    const scaledIngredients = recipe.ingredients.map(ing => ({
      ...ing,
      quantity: Math.round((ing.quantity * scaleFactor) * 100) / 100 // Arrondir à 2 décimales
    }));

    return {
      ...recipe,
      servings: newServings,
      ingredients: scaledIngredients,
      scaleFactor
    };
  }

  async searchRecipes(query, filters = {}) {
    const where = {};

    // Recherche textuelle
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { dietaryTags: { has: query.toLowerCase() } },
        { mealTags: { has: query.toLowerCase() } },
        { occasionTags: { has: query.toLowerCase() } },
        {
          ingredients: {
            some: {
              ingredient: {
                name: { contains: query, mode: 'insensitive' }
              }
            }
          }
        }
      ];
    }

    // Filtres
    if (filters.mealType) where.mealType = filters.mealType;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.maxPrepTime) where.prepTime = { lte: filters.maxPrepTime };
    if (filters.maxCookTime) where.cookTime = { lte: filters.maxCookTime };
    if (filters.dietaryTags && filters.dietaryTags.length > 0) {
      where.dietaryTags = { hasEvery: filters.dietaryTags };
    }
    if (filters.mealTags && filters.mealTags.length > 0) {
      where.mealTags = { hasEvery: filters.mealTags };
    }
    if (filters.occasionTags && filters.occasionTags.length > 0) {
      where.occasionTags = { hasEvery: filters.occasionTags };
    }

    return await this.getRecipes(where);
  }

  async getRecipesByMealType(mealType) {
    return await this.getRecipes({ 
      mealType, 
      dietaryTags: { has: 'kosher' }
    });
  }

  async getPopularRecipes(limit = 10) {
    const recipes = await this.prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: {
              include: {
                category: true
              }
            }
          }
        },
        _count: {
          select: { meals: true }
        }
      },
      orderBy: {
        meals: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return recipes;
  }

  async getRecipeNutritionInfo(id) {
    // Placeholder pour informations nutritionnelles
    // Pourrait être étendu avec une base de données nutritionnelle
    const recipe = await this.getRecipeById(id);
    if (!recipe) throw new Error('Recette non trouvée');

    const nutrition = {
      estimatedCaloriesPerServing: 0,
      macros: {
        proteins: 0,
        carbohydrates: 0,
        fats: 0
      },
      allergens: [],
      dietaryRestrictions: {
        kosher: recipe.dietaryTags.includes('kosher'),
        vegetarian: recipe.dietaryTags.includes('vegetarian'),
        vegan: recipe.dietaryTags.includes('vegan'),
        glutenFree: recipe.dietaryTags.includes('gluten_free')
      }
    };

    // Analyser les ingrédients pour détecter les allergènes potentiels
    recipe.ingredients.forEach(ing => {
      const ingredientName = ing.ingredient.name.toLowerCase();
      
      if (ingredientName.includes('œuf') || ingredientName.includes('oeuf')) {
        nutrition.allergens.push('Œufs');
      }
      if (ingredientName.includes('lait') || ingredientName.includes('fromage') || ingredientName.includes('beurre')) {
        nutrition.allergens.push('Produits laitiers');
      }
      if (ingredientName.includes('gluten') || ingredientName.includes('blé') || ingredientName.includes('farine')) {
        nutrition.allergens.push('Gluten');
      }
      if (ingredientName.includes('noix') || ingredientName.includes('amande')) {
        nutrition.allergens.push('Fruits à coque');
      }
    });

    // Supprimer les doublons
    nutrition.allergens = [...new Set(nutrition.allergens)];

    return nutrition;
  }

  async getRecipeStats() {
    const stats = await this.prisma.recipe.aggregate({
      _count: { id: true },
      _avg: { 
        prepTime: true,
        cookTime: true,
        servings: true
      }
    });

    const mealTypeStats = await this.prisma.recipe.groupBy({
      by: ['mealType'],
      _count: { mealType: true }
    });

    const difficultyStats = await this.prisma.recipe.groupBy({
      by: ['difficulty'],
      _count: { difficulty: true }
    });

    return {
      total: stats._count.id,
      averages: {
        prepTime: Math.round(stats._avg.prepTime || 0),
        cookTime: Math.round(stats._avg.cookTime || 0),
        servings: Math.round(stats._avg.servings || 0)
      },
      byMealType: mealTypeStats.reduce((acc, item) => {
        acc[item.mealType] = item._count.mealType;
        return acc;
      }, {}),
      byDifficulty: difficultyStats.reduce((acc, item) => {
        acc[item.difficulty] = item._count.difficulty;
        return acc;
      }, {})
    };
  }

  async suggestRecipes(preferences = {}) {
    const {
      mealType,
      maxPrepTime,
      excludeIngredients = [],
      favoriteIngredients = [],
      difficulty = ['easy', 'medium']
    } = preferences;

    const where = {
      dietaryTags: { has: 'kosher' },
      difficulty: { in: difficulty }
    };

    if (mealType) where.mealType = mealType;
    if (maxPrepTime) where.prepTime = { lte: maxPrepTime };

    // Exclure les recettes avec certains ingrédients
    if (excludeIngredients.length > 0) {
      where.NOT = {
        ingredients: {
          some: {
            ingredient: {
              name: { in: excludeIngredients }
            }
          }
        }
      };
    }

    // Favoriser les recettes avec des ingrédients préférés
    let recipes = await this.getRecipes(where);

    if (favoriteIngredients.length > 0) {
      recipes = recipes.sort((a, b) => {
        const aFavorites = a.ingredients.filter(ing => 
          favoriteIngredients.includes(ing.ingredient.name)
        ).length;
        const bFavorites = b.ingredients.filter(ing => 
          favoriteIngredients.includes(ing.ingredient.name)
        ).length;
        
        return bFavorites - aFavorites;
      });
    }

    return recipes.slice(0, 10); // Retourner les 10 meilleures suggestions
  }
}

module.exports = RecipeService;