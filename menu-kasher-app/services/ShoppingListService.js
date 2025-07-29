const moment = require('moment');

class ShoppingListService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getShoppingLists(where = {}) {
    return await this.prisma.shoppingList.findMany({
      where,
      include: {
        menu: {
          select: { id: true, name: true, startDate: true, endDate: true }
        },
        user: {
          select: { id: true, name: true, adultsCount: true, childrenCount: true }
        },
        items: {
          include: {
            ingredient: {
              include: {
                category: true
              }
            }
          },
          orderBy: [
            { ingredient: { category: { orderIndex: 'asc' } } },
            { ingredient: { name: 'asc' } }
          ]
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getShoppingListById(id) {
    return await this.prisma.shoppingList.findUnique({
      where: { id },
      include: {
        menu: {
          include: {
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
              }
            }
          }
        },
        user: true,
        items: {
          include: {
            ingredient: {
              include: {
                category: true
              }
            }
          },
          orderBy: [
            { ingredient: { category: { orderIndex: 'asc' } } },
            { ingredient: { name: 'asc' } }
          ]
        }
      }
    });
  }

  async generateFromMenu(menuId, userId) {
    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
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
          }
        }
      }
    });

    if (!menu) throw new Error('Menu non trouvé');

    // Créer la liste de courses
    const shoppingList = await this.prisma.shoppingList.create({
      data: {
        name: `Liste de courses - ${menu.name}`,
        menuId,
        userId
      }
    });

    // Agréger tous les ingrédients du menu
    const ingredientMap = new Map();
    const familySize = menu.user.adultsCount + menu.user.childrenCount;
    const familyMultiplier = familySize / 4; // Base sur 4 personnes

    menu.meals.forEach(meal => {
      if (!meal.recipe) return;

      meal.recipe.ingredients.forEach(recipeIngredient => {
        const ingredient = recipeIngredient.ingredient;
        const baseQuantity = recipeIngredient.quantity;
        
        // Ajuster selon le type de repas et la taille de la famille
        let adjustedQuantity = baseQuantity;
        
        if (meal.mealType === 'lunch_children' || meal.mealType === 'dinner_children') {
          // Pour les enfants, utiliser le nombre d'enfants
          adjustedQuantity = (baseQuantity / meal.recipe.servings) * menu.user.childrenCount;
        } else if (meal.mealType === 'dinner_adults') {
          // Pour les adultes, utiliser la taille de la famille
          adjustedQuantity = (baseQuantity / meal.recipe.servings) * familySize;
        }

        const key = ingredient.id;
        const unit = recipeIngredient.unit || ingredient.unit;

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          // Sommer les quantités si même unité
          if (existing.unit === unit) {
            existing.quantity += adjustedQuantity;
          } else {
            // Si unités différentes, créer une note
            existing.notes = existing.notes ? 
              `${existing.notes} + ${adjustedQuantity}${unit}` : 
              `${adjustedQuantity}${unit}`;
          }
        } else {
          ingredientMap.set(key, {
            ingredientId: ingredient.id,
            ingredient: ingredient,
            quantity: adjustedQuantity,
            unit: unit,
            notes: null
          });
        }
      });
    });

    // Créer les articles de la liste de courses
    const items = Array.from(ingredientMap.values()).map(item => ({
      shoppingListId: shoppingList.id,
      ingredientId: item.ingredientId,
      quantity: Math.ceil(item.quantity * 10) / 10, // Arrondir à 1 décimale
      unit: item.unit,
      notes: item.notes,
      isPurchased: false
    }));

    if (items.length > 0) {
      await this.prisma.shoppingListItem.createMany({
        data: items
      });
    }

    return await this.getShoppingListById(shoppingList.id);
  }

  async updateItem(itemId, { quantity, unit, isPurchased, notes }) {
    return await this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(isPurchased !== undefined && { isPurchased }),
        ...(notes !== undefined && { notes })
      },
      include: {
        ingredient: {
          include: {
            category: true
          }
        }
      }
    });
  }

  async addItem(shoppingListId, { ingredientId, quantity, unit, notes }) {
    // Vérifier si l'ingrédient existe déjà dans la liste
    const existingItem = await this.prisma.shoppingListItem.findUnique({
      where: {
        shoppingListId_ingredientId: {
          shoppingListId,
          ingredientId
        }
      }
    });

    if (existingItem) {
      // Mettre à jour l'article existant
      return await this.updateItem(existingItem.id, {
        quantity: existingItem.quantity + quantity,
        notes: notes || existingItem.notes
      });
    } else {
      // Créer un nouvel article
      return await this.prisma.shoppingListItem.create({
        data: {
          shoppingListId,
          ingredientId,
          quantity,
          unit,
          notes,
          isPurchased: false
        },
        include: {
          ingredient: {
            include: {
              category: true
            }
          }
        }
      });
    }
  }

  async removeItem(itemId) {
    return await this.prisma.shoppingListItem.delete({
      where: { id: itemId }
    });
  }

  async getShoppingListSummary(shoppingListId) {
    const shoppingList = await this.getShoppingListById(shoppingListId);
    if (!shoppingList) throw new Error('Liste de courses non trouvée');

    const summary = {
      totalItems: shoppingList.items.length,
      purchasedItems: shoppingList.items.filter(item => item.isPurchased).length,
      categories: {},
      estimatedCost: 0 // Pourrait être calculé avec des prix moyens
    };

    summary.remainingItems = summary.totalItems - summary.purchasedItems;
    summary.completionPercentage = summary.totalItems > 0 ? 
      Math.round((summary.purchasedItems / summary.totalItems) * 100) : 0;

    // Grouper par catégories
    shoppingList.items.forEach(item => {
      const categoryName = item.ingredient.category.displayName;
      if (!summary.categories[categoryName]) {
        summary.categories[categoryName] = {
          total: 0,
          purchased: 0,
          items: []
        };
      }
      
      summary.categories[categoryName].total++;
      if (item.isPurchased) {
        summary.categories[categoryName].purchased++;
      }
      
      summary.categories[categoryName].items.push({
        name: item.ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        isPurchased: item.isPurchased,
        notes: item.notes
      });
    });

    return summary;
  }

  async markAllAsPurchased(shoppingListId) {
    const result = await this.prisma.shoppingListItem.updateMany({
      where: { shoppingListId },
      data: { isPurchased: true }
    });

    return { updatedCount: result.count };
  }

  async markAllAsUnpurchased(shoppingListId) {
    const result = await this.prisma.shoppingListItem.updateMany({
      where: { shoppingListId },
      data: { isPurchased: false }
    });

    return { updatedCount: result.count };
  }

  async optimizeShoppingList(shoppingListId) {
    const shoppingList = await this.getShoppingListById(shoppingListId);
    if (!shoppingList) throw new Error('Liste de courses non trouvée');

    // Regrouper les articles similaires et optimiser les quantités
    const optimizations = [];
    const itemGroups = {};

    shoppingList.items.forEach(item => {
      const key = `${item.ingredient.name}_${item.unit}`;
      if (!itemGroups[key]) {
        itemGroups[key] = [];
      }
      itemGroups[key].push(item);
    });

    // Suggérer des regroupements pour les articles en double
    Object.values(itemGroups).forEach(group => {
      if (group.length > 1) {
        const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);
        optimizations.push({
          type: 'merge',
          items: group.map(item => item.id),
          suggestion: `Regrouper ${group[0].ingredient.name}: ${totalQuantity}${group[0].unit}`,
          newQuantity: totalQuantity
        });
      }
    });

    // Suggérer des conversions d'unités pour optimiser l'achat
    shoppingList.items.forEach(item => {
      if (item.unit === 'g' && item.quantity >= 1000) {
        optimizations.push({
          type: 'unit_conversion',
          itemId: item.id,
          suggestion: `Convertir ${item.ingredient.name}: ${item.quantity / 1000}kg au lieu de ${item.quantity}g`,
          newQuantity: item.quantity / 1000,
          newUnit: 'kg'
        });
      }
    });

    return optimizations;
  }

  async exportToPrintableFormat(shoppingListId) {
    const shoppingList = await this.getShoppingListById(shoppingListId);
    if (!shoppingList) throw new Error('Liste de courses non trouvée');

    const categories = {};
    
    shoppingList.items.forEach(item => {
      const categoryName = item.ingredient.category.displayName;
      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }
      
      categories[categoryName].push({
        name: item.ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
        checked: item.isPurchased
      });
    });

    return {
      title: shoppingList.name,
      menuName: shoppingList.menu.name,
      period: `${moment(shoppingList.menu.startDate).format('DD/MM/YYYY')} - ${moment(shoppingList.menu.endDate).format('DD/MM/YYYY')}`,
      categories,
      generatedAt: moment().format('DD/MM/YYYY HH:mm'),
      totalItems: shoppingList.items.length
    };
  }
}

module.exports = ShoppingListService;