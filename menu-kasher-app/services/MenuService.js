const moment = require('moment');

class MenuService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getMenus(where = {}) {
    return await this.prisma.menu.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, adultsCount: true, childrenCount: true }
        },
        meals: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          },
          orderBy: [
            { date: 'asc' },
            { mealType: 'asc' }
          ]
        },
        _count: {
          select: { meals: true, shoppingLists: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMenuById(id) {
    return await this.prisma.menu.findUnique({
      where: { id },
      include: {
        user: true,
        meals: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    ingredient: {
                      include: {
                        category: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { date: 'asc' },
            { mealType: 'asc' }
          ]
        },
        shoppingLists: {
          include: {
            items: {
              include: {
                ingredient: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async createMenu({ name, startDate, userId, durationDays = 14 }) {
    const endDate = moment(startDate).add(durationDays, 'days').toDate();
    
    // Désactiver les autres menus de l'utilisateur
    await this.prisma.menu.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    return await this.prisma.menu.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate,
        userId,
        isActive: true
      },
      include: {
        user: true,
        meals: true
      }
    });
  }

  async generateMenu(menuId, options = {}) {
    const menu = await this.getMenuById(menuId);
    if (!menu) throw new Error('Menu non trouvé');

    const { excludeRecipes = [], preferences = [] } = options;
    
    // Supprimer les repas existants
    await this.prisma.meal.deleteMany({
      where: { menuId }
    });

    // Générer les repas pour chaque jour
    const startDate = moment(menu.startDate);
    const endDate = moment(menu.endDate);
    const meals = [];

    for (let date = startDate.clone(); date.isBefore(endDate); date.add(1, 'day')) {
      const dayOfWeek = date.day(); // 0 = dimanche, 6 = samedi
      const isShabbat = dayOfWeek === 6; // samedi
      const isFridayEvening = dayOfWeek === 5; // vendredi soir

      // Déjeuner enfants (sauf samedi)
      if (!isShabbat) {
        const lunchRecipe = await this.selectRandomRecipe('lunch_children', excludeRecipes, preferences);
        if (lunchRecipe) {
          meals.push({
            menuId,
            date: date.toDate(),
            mealType: 'lunch_children',
            audience: 'children',
            recipeId: lunchRecipe.id
          });
        }
      }

      // Dîner enfants (sauf vendredi soir et samedi midi)
      if (!isFridayEvening && !isShabbat) {
        const dinnerChildrenRecipe = await this.selectRandomRecipe('dinner_children', excludeRecipes, preferences);
        if (dinnerChildrenRecipe) {
          meals.push({
            menuId,
            date: date.toDate(),
            mealType: 'dinner_children',
            audience: 'children',
            recipeId: dinnerChildrenRecipe.id
          });
        }
      }

      // Dîner adultes (sauf vendredi soir et samedi midi, mais oui samedi soir)
      if (!isFridayEvening && !(isShabbat && date.hour() < 18)) {
        const dinnerAdultsRecipe = await this.selectRandomRecipe('dinner_adults', excludeRecipes, preferences);
        if (dinnerAdultsRecipe) {
          meals.push({
            menuId,
            date: date.toDate(),
            mealType: 'dinner_adults',
            audience: 'adults',
            recipeId: dinnerAdultsRecipe.id
          });
        }
      }
    }

    // Créer tous les repas
    if (meals.length > 0) {
      await this.prisma.meal.createMany({
        data: meals
      });
    }

    return await this.getMenuById(menuId);
  }

  async selectRandomRecipe(mealType, excludeRecipes = [], preferences = []) {
    const where = {
      mealType,
      dietaryTags: { has: 'kosher' },
      id: { notIn: excludeRecipes }
    };

    // Appliquer les préférences
    if (preferences.includes('pas_de_tofu')) {
      where.NOT = {
        ingredients: {
          some: {
            ingredient: {
              name: { contains: 'tofu', mode: 'insensitive' }
            }
          }
        }
      };
    }

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (recipes.length === 0) return null;

    // Sélection aléatoire
    const randomIndex = Math.floor(Math.random() * recipes.length);
    return recipes[randomIndex];
  }

  async updateMeal(mealId, { recipeId, notes }) {
    return await this.prisma.meal.update({
      where: { id: mealId },
      data: { 
        recipeId: recipeId || null,
        notes: notes || null
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        }
      }
    });
  }

  async duplicateMenu(menuId, newName, newStartDate) {
    const originalMenu = await this.getMenuById(menuId);
    if (!originalMenu) throw new Error('Menu original non trouvé');

    const durationDays = moment(originalMenu.endDate).diff(moment(originalMenu.startDate), 'days');
    
    // Créer le nouveau menu
    const newMenu = await this.createMenu({
      name: newName,
      startDate: newStartDate,
      userId: originalMenu.userId,
      durationDays
    });

    // Copier les repas avec ajustement des dates
    const dateDiff = moment(newStartDate).diff(moment(originalMenu.startDate), 'days');
    
    const newMeals = originalMenu.meals.map(meal => ({
      menuId: newMenu.id,
      date: moment(meal.date).add(dateDiff, 'days').toDate(),
      mealType: meal.mealType,
      recipeId: meal.recipeId,
      notes: meal.notes
    }));

    if (newMeals.length > 0) {
      await this.prisma.meal.createMany({
        data: newMeals
      });
    }

    return await this.getMenuById(newMenu.id);
  }

  async getMenuStats(menuId) {
    const menu = await this.getMenuById(menuId);
    if (!menu) throw new Error('Menu non trouvé');

    const stats = {
      totalMeals: menu.meals.length,
      mealTypes: {
        lunch_children: menu.meals.filter(m => m.mealType === 'lunch_children').length,
        dinner_children: menu.meals.filter(m => m.mealType === 'dinner_children').length,
        dinner_adults: menu.meals.filter(m => m.mealType === 'dinner_adults').length
      },
      uniqueRecipes: new Set(menu.meals.map(m => m.recipeId).filter(Boolean)).size,
      totalIngredients: 0,
      avgPrepTime: 0,
      avgCookTime: 0
    };

    // Calculer les statistiques des ingrédients et temps
    const recipesWithTime = menu.meals
      .map(m => m.recipe)
      .filter(Boolean);

    if (recipesWithTime.length > 0) {
      const prepTimes = recipesWithTime.map(r => r.prepTime).filter(Boolean);
      const cookTimes = recipesWithTime.map(r => r.cookTime).filter(Boolean);

      stats.avgPrepTime = prepTimes.length > 0 ? 
        Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : 0;
      
      stats.avgCookTime = cookTimes.length > 0 ? 
        Math.round(cookTimes.reduce((a, b) => a + b, 0) / cookTimes.length) : 0;

      // Compter les ingrédients uniques
      const allIngredients = new Set();
      recipesWithTime.forEach(recipe => {
        recipe.ingredients.forEach(ing => {
          allIngredients.add(ing.ingredient.name);
        });
      });
      stats.totalIngredients = allIngredients.size;
    }

    return stats;
  }
}

module.exports = MenuService;