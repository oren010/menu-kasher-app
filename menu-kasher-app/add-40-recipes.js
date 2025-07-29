// Script pour ajouter 40 nouvelles recettes diversifiées
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const newRecipes = [
  // Plats végétariens/végétaliens
  {
    name: "Curry de lentilles aux épinards",
    description: "Plat végétalien riche en protéines et saveurs épicées",
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    difficulty: "medium",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "indienne",
    caloriesPerServing: 320,
    proteinPerServing: 18,
    carbsPerServing: 45,
    fatPerServing: 8,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["spicy", "comfort"],
    occasionTags: ["weeknight", "healthy"],
    allergens: [],
    instructions: [
      "Rincer les lentilles et les faire cuire 20 minutes",
      "Faire revenir oignons, ail et épices",
      "Ajouter les épinards et laisser flétrir",
      "Mélanger avec les lentilles et lait de coco",
      "Laisser mijoter 10 minutes"
    ],
    tips: ["Servir avec du riz basmati", "Ajuster les épices selon le goût"],
    equipment: ["casserole", "poêle"],
    suggestedDrink: "Lassi à la mangue",
    suggestedSides: ["Riz basmati", "Naan"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 3
  },
  
  {
    name: "Risotto aux champignons",
    description: "Risotto crémeux aux champignons variés",
    servings: 4,
    prepTime: 10,
    cookTime: 25,
    totalTime: 35,
    difficulty: "hard",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "italienne",
    caloriesPerServing: 380,
    proteinPerServing: 12,
    carbsPerServing: 58,
    fatPerServing: 12,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["creamy", "comfort"],
    occasionTags: ["dinner_party", "romantic"],
    allergens: ["dairy"],
    instructions: [
      "Faire chauffer le bouillon et le maintenir chaud",
      "Faire revenir les champignons séparément",
      "Faire nacrer le riz dans l'huile d'olive",
      "Ajouter le vin blanc et laisser évaporer",
      "Ajouter le bouillon louche par louche en remuant",
      "Incorporer les champignons et le parmesan"
    ],
    tips: ["Remuer constamment pour la crémosité", "Utiliser du riz arborio"],
    equipment: ["casserole", "poêle", "louche"],
    suggestedDrink: "Vin blanc sec",
    suggestedSides: ["Salade verte", "Pain à l'ail"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 2
  },

  {
    name: "Salade de quinoa aux légumes grillés",
    description: "Salade nutritive et colorée parfaite pour l'été",
    servings: 3,
    prepTime: 20,
    cookTime: 15,
    totalTime: 35,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "méditerranéenne",
    caloriesPerServing: 285,
    proteinPerServing: 10,
    carbsPerServing: 42,
    fatPerServing: 9,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["fresh", "healthy"],
    occasionTags: ["summer", "lunch"],
    allergens: [],
    instructions: [
      "Cuire le quinoa selon les instructions",
      "Couper les légumes et les griller",
      "Préparer la vinaigrette citron-huile d'olive",
      "Mélanger quinoa, légumes et vinaigrette",
      "Ajouter les herbes fraîches"
    ],
    tips: ["Laisser refroidir avant de servir", "Peut se préparer la veille"],
    equipment: ["casserole", "plaque de cuisson"],
    suggestedDrink: "Eau infusée au citron",
    suggestedSides: ["Houmous", "Pain pita"],
    canMakeAhead: true,
    freezable: false,
    leftoverDays: 2
  },

  // Plats de poisson
  {
    name: "Cabillaud aux herbes et citron",
    description: "Poisson blanc délicat cuit au four avec des herbes fraîches",
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    totalTime: 30,
    difficulty: "easy",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "française",
    caloriesPerServing: 220,
    proteinPerServing: 35,
    carbsPerServing: 2,
    fatPerServing: 8,
    dietaryTags: ["pescatarian", "kosher"],
    mealTags: ["light", "elegant"],
    occasionTags: ["weeknight", "healthy"],
    allergens: [],
    instructions: [
      "Préchauffer le four à 180°C",
      "Disposer le cabillaud dans un plat",
      "Arroser d'huile d'olive et de jus de citron",
      "Parsemer d'herbes fraîches",
      "Cuire 15-20 minutes selon l'épaisseur"
    ],
    tips: ["Ne pas trop cuire pour éviter qu'il se dessèche"],
    equipment: ["plat à four"],
    suggestedDrink: "Vin blanc sec",
    suggestedSides: ["Légumes vapeur", "Riz pilaf"],
    canMakeAhead: false,
    freezable: true,
    leftoverDays: 2
  },

  {
    name: "Tacos de poisson épicés",
    description: "Tacos mexicains avec poisson grillé et sauce piquante",
    servings: 4,
    prepTime: 15,
    cookTime: 10,
    totalTime: 25,
    difficulty: "medium",
    mealType: "dinner_children",
    audience: "both",
    cuisine: "mexicaine",
    caloriesPerServing: 340,
    proteinPerServing: 28,
    carbsPerServing: 32,
    fatPerServing: 12,
    dietaryTags: ["pescatarian", "kosher"],
    mealTags: ["spicy", "fun"],
    occasionTags: ["casual", "summer"],
    allergens: [],
    instructions: [
      "Mariner le poisson dans les épices",
      "Griller le poisson 3-4 minutes par côté",
      "Réchauffer les tortillas",
      "Préparer la salade de chou",
      "Assembler les tacos avec tous les ingrédients"
    ],
    tips: ["Servir immédiatement pour que ça reste croustillant"],
    equipment: ["poêle", "grill"],
    suggestedDrink: "Eau de coco",
    suggestedSides: ["Guacamole", "Haricots noirs"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 1
  },

  // Plats de viande kasher
  {
    name: "Bœuf bourguignon kasher",
    description: "Classique français adapté aux règles kasher",
    servings: 6,
    prepTime: 30,
    cookTime: 180,
    totalTime: 210,
    difficulty: "hard",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "française",
    caloriesPerServing: 420,
    proteinPerServing: 38,
    carbsPerServing: 12,
    fatPerServing: 22,
    dietaryTags: ["kosher"],
    mealTags: ["comfort", "rich"],
    occasionTags: ["weekend", "special"],
    allergens: [],
    instructions: [
      "Couper le bœuf en gros cubes",
      "Faire revenir la viande jusqu'à coloration",
      "Ajouter légumes, herbes et vin rouge kasher",
      "Laisser mijoter 2h30 à feu doux",
      "Vérifier l'assaisonnement avant de servir"
    ],
    tips: ["Meilleur réchauffé le lendemain", "Utiliser un vin kasher de qualité"],
    equipment: ["cocotte", "couteau"],
    suggestedDrink: "Vin rouge kasher",
    suggestedSides: ["Purée de pommes de terre", "Légumes racines"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 4
  },

  {
    name: "Escalopes de poulet panées",
    description: "Escalopes croustillantes et tendres, parfaites pour les enfants",
    servings: 4,
    prepTime: 15,
    cookTime: 8,
    totalTime: 23,
    difficulty: "easy",
    mealType: "dinner_children",
    audience: "children",
    cuisine: "française",
    caloriesPerServing: 310,
    proteinPerServing: 32,
    carbsPerServing: 18,
    fatPerServing: 12,
    dietaryTags: ["kosher"],
    mealTags: ["crispy", "comfort"],
    occasionTags: ["weeknight", "kids"],
    allergens: ["gluten", "eggs"],
    instructions: [
      "Aplatir les escalopes au maillet",
      "Passer dans la farine, œuf battu puis chapelure",
      "Chauffer l'huile dans une poêle",
      "Cuire 3-4 minutes de chaque côté",
      "Égoutter sur papier absorbant"
    ],
    tips: ["L'huile doit être chaude mais pas fumante"],
    equipment: ["poêle", "maillet", "assiettes"],
    suggestedDrink: "Jus de pomme",
    suggestedSides: ["Frites", "Petits pois"],
    canMakeAhead: false,
    freezable: true,
    leftoverDays: 2
  },

  // Plats pour enfants
  {
    name: "Mini pizzas aux légumes",
    description: "Petites pizzas colorées que les enfants adorent",
    servings: 6,
    prepTime: 20,
    cookTime: 12,
    totalTime: 32,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "children",
    cuisine: "italienne",
    caloriesPerServing: 245,
    proteinPerServing: 12,
    carbsPerServing: 35,
    fatPerServing: 8,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["fun", "colorful"],
    occasionTags: ["kids", "party"],
    allergens: ["gluten", "dairy"],
    instructions: [
      "Étaler la pâte et découper en cercles",
      "Étaler la sauce tomate",
      "Ajouter fromage et légumes colorés",
      "Cuire au four 10-12 minutes",
      "Laisser refroidir avant de servir"
    ],
    tips: ["Laisser les enfants choisir leurs légumes"],
    equipment: ["four", "plaque", "emporte-pièce"],
    suggestedDrink: "Lait",
    suggestedSides: ["Salade de fruits", "Bâtonnets de carotte"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 2
  },

  {
    name: "Nuggets de poisson maison",
    description: "Alternative saine aux nuggets industriels",
    servings: 4,
    prepTime: 15,
    cookTime: 10,
    totalTime: 25,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "children",
    cuisine: "moderne",
    caloriesPerServing: 260,
    proteinPerServing: 28,
    carbsPerServing: 15,
    fatPerServing: 10,
    dietaryTags: ["pescatarian", "kosher"],
    mealTags: ["crispy", "healthy"],
    occasionTags: ["kids", "weeknight"],
    allergens: ["gluten", "eggs"],
    instructions: [
      "Couper le poisson en bâtonnets",
      "Tremper dans œuf battu puis chapelure",
      "Cuire au four 8-10 minutes",
      "Retourner à mi-cuisson",
      "Servir avec sauce au yaourt"
    ],
    tips: ["Utiliser du poisson blanc ferme"],
    equipment: ["four", "plaque"],
    suggestedDrink: "Jus d'orange",
    suggestedSides: ["Frites de patate douce", "Haricots verts"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 2
  },

  // Plats internationaux
  {
    name: "Pad Thaï végétarien",
    description: "Nouilles thaï sautées aux légumes et tofu",
    servings: 4,
    prepTime: 20,
    cookTime: 10,
    totalTime: 30,
    difficulty: "medium",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "thaï",
    caloriesPerServing: 350,
    proteinPerServing: 15,
    carbsPerServing: 52,
    fatPerServing: 10,
    dietaryTags: ["vegan", "vegetarian"],
    mealTags: ["exotic", "spicy"],
    occasionTags: ["weeknight", "asian"],
    allergens: ["soy", "nuts"],
    instructions: [
      "Faire tremper les nouilles de riz",
      "Préparer tous les ingrédients",
      "Chauffer le wok très fort",
      "Sauter rapidement tous les éléments",
      "Ajouter la sauce et mélanger"
    ],
    tips: ["Tout doit aller très vite, préparer à l'avance"],
    equipment: ["wok", "bols"],
    suggestedDrink: "Thé glacé au jasmin",
    suggestedSides: ["Rouleaux de printemps", "Salade de papaye"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 1
  },

  {
    name: "Chili végétarien aux trois haricots",
    description: "Chili consistant et épicé parfait pour l'hiver",
    servings: 6,
    prepTime: 15,
    cookTime: 45,
    totalTime: 60,
    difficulty: "easy",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "tex-mex",
    caloriesPerServing: 285,
    proteinPerServing: 16,
    carbsPerServing: 48,
    fatPerServing: 5,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["spicy", "comfort"],
    occasionTags: ["winter", "casual"],
    allergens: [],
    instructions: [
      "Faire revenir oignons et ail",
      "Ajouter épices et faire griller 1 minute",
      "Ajouter tomates et haricots",
      "Laisser mijoter 30-40 minutes",
      "Rectifier l'assaisonnement"
    ],
    tips: ["Meilleur le lendemain", "Servir avec du riz ou tortillas"],
    equipment: ["casserole"],
    suggestedDrink: "Bière sans alcool",
    suggestedSides: ["Riz complet", "Avocat", "Crème fraîche"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 4
  },

  // Plats rapides
  {
    name: "Omelette aux fines herbes",
    description: "Omelette classique et rapide pour tous les repas",
    servings: 2,
    prepTime: 5,
    cookTime: 5,
    totalTime: 10,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "française",
    caloriesPerServing: 210,
    proteinPerServing: 16,
    carbsPerServing: 2,
    fatPerServing: 15,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["quick", "protein"],
    occasionTags: ["breakfast", "quick"],
    allergens: ["eggs", "dairy"],
    instructions: [
      "Battre les œufs avec sel et poivre",
      "Chauffer le beurre dans la poêle",
      "Verser les œufs et laisser prendre",
      "Ajouter les herbes sur une moitié",
      "Plier l'omelette et servir"
    ],
    tips: ["La poêle doit être bien chaude"],
    equipment: ["poêle", "fouet"],
    suggestedDrink: "Jus d'orange",
    suggestedSides: ["Salade verte", "Pain grillé"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 0
  },

  {
    name: "Wrap au thon et crudités",
    description: "Wrap frais et croquant parfait pour le déjeuner",
    servings: 2,
    prepTime: 10,
    cookTime: 0,
    totalTime: 10,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "moderne",
    caloriesPerServing: 320,
    proteinPerServing: 22,
    carbsPerServing: 28,
    fatPerServing: 14,
    dietaryTags: ["pescatarian", "kosher"],
    mealTags: ["fresh", "portable"],
    occasionTags: ["lunch", "picnic"],
    allergens: [],
    instructions: [
      "Égoutter et émietter le thon",
      "Mélanger avec mayonnaise et épices",
      "Étaler sur la tortilla",
      "Ajouter légumes croquants",
      "Rouler serré et couper en deux"
    ],
    tips: ["Bien serrer pour éviter que ça se défasse"],
    equipment: ["bol", "couteau"],
    suggestedDrink: "Eau pétillante",
    suggestedSides: ["Chips", "Cornichons"],
    canMakeAhead: true,
    freezable: false,
    leftoverDays: 1
  },

  // Soupes
  {
    name: "Soupe de lentilles corail",
    description: "Soupe crémeuse et réconfortante",
    servings: 4,
    prepTime: 10,
    cookTime: 25,
    totalTime: 35,
    difficulty: "easy",
    mealType: "dinner_adults",
    audience: "both",
    cuisine: "orientale",
    caloriesPerServing: 220,
    proteinPerServing: 12,
    carbsPerServing: 35,
    fatPerServing: 4,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["comfort", "warm"],
    occasionTags: ["winter", "healthy"],
    allergens: [],
    instructions: [
      "Faire revenir oignons et épices",
      "Ajouter lentilles et bouillon",
      "Cuire 20 minutes jusqu'à tendreté",
      "Mixer partiellement",
      "Ajuster assaisonnement et servir"
    ],
    tips: ["Les lentilles corail cuisent très vite"],
    equipment: ["casserole", "mixeur plongeant"],
    suggestedDrink: "Thé à la menthe",
    suggestedSides: ["Pain naan", "Yaourt nature"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 3
  },

  {
    name: "Velouté de butternut aux épices",
    description: "Soupe douce et parfumée aux épices orientales",
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    totalTime: 45,
    difficulty: "easy",
    mealType: "dinner_adults",
    audience: "both",
    cuisine: "française",
    caloriesPerServing: 180,
    proteinPerServing: 4,
    carbsPerServing: 32,
    fatPerServing: 5,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["smooth", "warm"],
    occasionTags: ["autumn", "elegant"],
    allergens: [],
    instructions: [
      "Éplucher et couper la courge en cubes",
      "Faire revenir avec oignons",
      "Ajouter bouillon et épices",
      "Cuire 25 minutes",
      "Mixer jusqu'à obtenir un velouté lisse"
    ],
    tips: ["Ajouter un peu de crème pour plus d'onctuosité"],
    equipment: ["casserole", "mixeur"],
    suggestedDrink: "Vin blanc",
    suggestedSides: ["Croûtons", "Graines de courge grillées"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 3
  },

  // Salades
  {
    name: "Salade grecque traditionnelle",
    description: "Salade fraîche aux saveurs méditerranéennes",
    servings: 4,
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "grecque",
    caloriesPerServing: 245,
    proteinPerServing: 8,
    carbsPerServing: 12,
    fatPerServing: 18,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["fresh", "mediterranean"],
    occasionTags: ["summer", "light"],
    allergens: ["dairy"],
    instructions: [
      "Couper tomates, concombre et oignon",
      "Ajouter olives et feta émiettée",
      "Préparer vinaigrette à l'huile d'olive",
      "Mélanger délicatement",
      "Laisser mariner 10 minutes"
    ],
    tips: ["Utiliser des tomates bien mûres"],
    equipment: ["saladier", "couteau"],
    suggestedDrink: "Ouzo sans alcool",
    suggestedSides: ["Pain pita", "Houmous"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 1
  },

  {
    name: "Salade de pâtes au pesto",
    description: "Salade de pâtes colorée et parfumée",
    servings: 6,
    prepTime: 20,
    cookTime: 12,
    totalTime: 32,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "italienne",
    caloriesPerServing: 320,
    proteinPerServing: 12,
    carbsPerServing: 45,
    fatPerServing: 11,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["fresh", "herby"],
    occasionTags: ["picnic", "summer"],
    allergens: ["gluten", "dairy", "nuts"],
    instructions: [
      "Cuire les pâtes al dente",
      "Préparer le pesto maison",
      "Couper tomates cerises et mozzarella",
      "Mélanger pâtes tièdes avec pesto",
      "Ajouter légumes et mélanger"
    ],
    tips: ["Servir tiède ou à température ambiante"],
    equipment: ["casserole", "mixeur"],
    suggestedDrink: "Limonade",
    suggestedSides: ["Bruschetta", "Olives"],
    canMakeAhead: true,
    freezable: false,
    leftoverDays: 2
  },

  // Desserts/goûters
  {
    name: "Pancakes aux myrtilles",
    description: "Pancakes moelleux parfaits pour le petit-déjeuner",
    servings: 4,
    prepTime: 10,
    cookTime: 15,
    totalTime: 25,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "children",
    cuisine: "américaine",
    caloriesPerServing: 280,
    proteinPerServing: 8,
    carbsPerServing: 48,
    fatPerServing: 6,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["sweet", "fluffy"],
    occasionTags: ["breakfast", "weekend"],
    allergens: ["gluten", "eggs", "dairy"],
    instructions: [
      "Mélanger ingrédients secs",
      "Battre œufs avec lait",
      "Incorporer délicatement les deux mélanges",
      "Ajouter les myrtilles",
      "Cuire dans une poêle bien chaude"
    ],
    tips: ["Ne pas trop mélanger la pâte"],
    equipment: ["poêle", "bols", "fouet"],
    suggestedDrink: "Lait",
    suggestedSides: ["Sirop d'érable", "Beurre"],
    canMakeAhead: false,
    freezable: true,
    leftoverDays: 2
  },

  {
    name: "Smoothie bowl aux fruits rouges",
    description: "Bol de smoothie épais garni de fruits frais",
    servings: 2,
    prepTime: 10,
    cookTime: 0,
    totalTime: 10,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "moderne",
    caloriesPerServing: 220,
    proteinPerServing: 8,
    carbsPerServing: 38,
    fatPerServing: 4,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["healthy", "fresh"],
    occasionTags: ["breakfast", "summer"],
    allergens: [],
    instructions: [
      "Mixer fruits congelés avec peu de liquide",
      "Obtenir une consistance épaisse",
      "Verser dans des bols",
      "Disposer joliment les toppings",
      "Servir immédiatement"
    ],
    tips: ["Utiliser des fruits bien congelés"],
    equipment: ["mixeur", "bols"],
    suggestedDrink: "Thé vert",
    suggestedSides: ["Granola", "Noix de coco"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 0
  }
];

// Continuer avec les 20 recettes restantes...
const moreRecipes = [
  // Plats d'accompagnement
  {
    name: "Gratin de courgettes au chèvre",
    description: "Gratin fondant et savoureux",
    servings: 6,
    prepTime: 20,
    cookTime: 35,
    totalTime: 55,
    difficulty: "medium",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "française",
    caloriesPerServing: 240,
    proteinPerServing: 12,
    carbsPerServing: 8,
    fatPerServing: 18,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["creamy", "comfort"],
    occasionTags: ["side_dish", "dinner_party"],
    allergens: ["dairy"],
    instructions: [
      "Trancher finement les courgettes",
      "Les faire dégorger avec du sel",
      "Disposer en couches dans un plat",
      "Ajouter chèvre et crème entre les couches",
      "Gratiner au four 30-35 minutes"
    ],
    tips: ["Bien égoutter les courgettes"],
    equipment: ["mandoline", "plat à gratin"],
    suggestedDrink: "Vin rosé",
    suggestedSides: ["Viande grillée", "Salade verte"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 3
  },

  {
    name: "Ratatouille provençale",
    description: "Légumes du soleil mijotés aux herbes de Provence",
    servings: 6,
    prepTime: 25,
    cookTime: 45,
    totalTime: 70,
    difficulty: "medium",
    mealType: "dinner_adults",
    audience: "both",
    cuisine: "française",
    caloriesPerServing: 120,
    proteinPerServing: 3,
    carbsPerServing: 18,
    fatPerServing: 5,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["traditional", "rustic"],
    occasionTags: ["summer", "healthy"],
    allergens: [],
    instructions: [
      "Couper tous les légumes en dés",
      "Faire revenir chaque légume séparément",
      "Assembler dans une cocotte",
      "Ajouter herbes et assaisonnement",
      "Laisser mijoter 30-40 minutes"
    ],
    tips: ["Chaque légume doit garder sa texture"],
    equipment: ["cocotte", "poêles"],
    suggestedDrink: "Rosé de Provence",
    suggestedSides: ["Riz", "Fromage de chèvre"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 4
  },

  // Plats de pâtes
  {
    name: "Spaghetti carbonara végétarienne",
    description: "Version végétarienne du classique italien",
    servings: 4,
    prepTime: 10,
    cookTime: 12,
    totalTime: 22,
    difficulty: "medium",
    mealType: "dinner_adults",
    audience: "adults",
    cuisine: "italienne",
    caloriesPerServing: 420,
    proteinPerServing: 18,
    carbsPerServing: 52,
    fatPerServing: 16,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["creamy", "quick"],
    occasionTags: ["weeknight", "comfort"],
    allergens: ["gluten", "eggs", "dairy"],
    instructions: [
      "Cuire les spaghetti al dente",
      "Battre œufs avec parmesan",
      "Faire griller champignons et courgettes",
      "Mélanger pâtes chaudes avec œufs",
      "Ajouter légumes et poivre"
    ],
    tips: ["Retirer du feu avant d'ajouter les œufs"],
    equipment: ["casserole", "poêle", "fouet"],
    suggestedDrink: "Vin blanc italien",
    suggestedSides: ["Salade roquette", "Pain à l'ail"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 1
  },

  {
    name: "Lasagnes aux épinards et ricotta",
    description: "Lasagnes végétariennes crémeuses et savoureuses",
    servings: 8,
    prepTime: 30,
    cookTime: 45,
    totalTime: 75,
    difficulty: "hard",
    mealType: "dinner_adults",
    audience: "both",
    cuisine: "italienne",
    caloriesPerServing: 380,
    proteinPerServing: 22,
    carbsPerServing: 35,
    fatPerServing: 18,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["comfort", "rich"],
    occasionTags: ["weekend", "family"],
    allergens: ["gluten", "dairy"],
    instructions: [
      "Préparer la béchamel",
      "Faire fondre les épinards",
      "Mélanger ricotta, épinards et œuf",
      "Monter les lasagnes en couches",
      "Cuire au four 40-45 minutes"
    ],
    tips: ["Laisser reposer 10 minutes avant de découper"],
    equipment: ["casserole", "plat à lasagnes"],
    suggestedDrink: "Chianti",
    suggestedSides: ["Salade César", "Pain focaccia"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 4
  },

  // Plats d'été
  {
    name: "Gazpacho andalou",
    description: "Soupe froide espagnole aux légumes frais",
    servings: 4,
    prepTime: 20,
    cookTime: 0,
    totalTime: 20,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "espagnole",
    caloriesPerServing: 85,
    proteinPerServing: 2,
    carbsPerServing: 12,
    fatPerServing: 4,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["cold", "fresh"],
    occasionTags: ["summer", "appetizer"],
    allergens: [],
    instructions: [
      "Éplucher et épépiner les tomates",
      "Découper tous les légumes",
      "Mixer tous les ingrédients ensemble",
      "Passer au chinois pour plus de finesse",
      "Réfrigérer au moins 2 heures"
    ],
    tips: ["Utiliser des légumes très frais et mûrs"],
    equipment: ["mixeur", "chinois"],
    suggestedDrink: "Sangria blanche",
    suggestedSides: ["Croûtons à l'ail", "Jambon serrano"],
    canMakeAhead: true,
    freezable: false,
    leftoverDays: 2
  },

  {
    name: "Salade de pastèque et feta",
    description: "Salade rafraîchissante sucrée-salée",
    servings: 4,
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "méditerranéenne",
    caloriesPerServing: 160,
    proteinPerServing: 6,
    carbsPerServing: 18,
    fatPerServing: 8,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["fresh", "summer"],
    occasionTags: ["appetizer", "light"],
    allergens: ["dairy"],
    instructions: [
      "Couper la pastèque en cubes",
      "Émietter la feta",
      "Ciseler la menthe fraîche",
      "Préparer vinaigrette au citron vert",
      "Mélanger délicatement au moment de servir"
    ],
    tips: ["Servir très frais"],
    equipment: ["couteau", "saladier"],
    suggestedDrink: "Thé glacé à la menthe",
    suggestedSides: ["Bruschettas", "Olives"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 1
  },

  // Plats de petit-déjeuner
  {
    name: "Porridge aux fruits et noix",
    description: "Petit-déjeuner nutritif et réconfortant",
    servings: 2,
    prepTime: 5,
    cookTime: 10,
    totalTime: 15,
    difficulty: "easy",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "britannique",
    caloriesPerServing: 320,
    proteinPerServing: 12,
    carbsPerServing: 52,
    fatPerServing: 8,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["warming", "nutritious"],
    occasionTags: ["breakfast", "healthy"],
    allergens: ["dairy", "nuts"],
    instructions: [
      "Faire chauffer lait et flocons d'avoine",
      "Remuer régulièrement 8-10 minutes",
      "Ajouter miel et cannelle",
      "Garnir de fruits et noix",
      "Servir chaud"
    ],
    tips: ["Varier les toppings selon les saisons"],
    equipment: ["casserole", "bols"],
    suggestedDrink: "Café au lait",
    suggestedSides: ["Jus d'orange", "Yaourt grec"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 1
  },

  {
    name: "Toast à l'avocat et œuf poché",
    description: "Petit-déjeuner tendance et nutritif",
    servings: 2,
    prepTime: 10,
    cookTime: 8,
    totalTime: 18,
    difficulty: "medium",
    mealType: "lunch_children",
    audience: "both",
    cuisine: "moderne",
    caloriesPerServing: 340,
    proteinPerServing: 16,
    carbsPerServing: 28,
    fatPerServing: 20,
    dietaryTags: ["vegetarian", "kosher"],
    mealTags: ["trendy", "nutritious"],
    occasionTags: ["breakfast", "brunch"],
    allergens: ["gluten", "eggs"],
    instructions: [
      "Faire pocher les œufs dans l'eau vinaigrée",
      "Griller le pain complet",
      "Écraser l'avocat avec citron",
      "Tartiner sur le pain grillé",
      "Déposer l'œuf poché dessus"
    ],
    tips: ["L'œuf doit être mollet"],
    equipment: ["casserole", "grille-pain"],
    suggestedDrink: "Smoothie vert",
    suggestedSides: ["Tomates cerises", "Roquette"],
    canMakeAhead: false,
    freezable: false,
    leftoverDays: 0
  },

  // Plats de fête
  {
    name: "Couscous végétarien aux sept légumes",
    description: "Version végétarienne du couscous traditionnel",
    servings: 6,
    prepTime: 30,
    cookTime: 60,
    totalTime: 90,
    difficulty: "hard",
    mealType: "dinner_adults",
    audience: "both",
    cuisine: "maghrébine",
    caloriesPerServing: 380,
    proteinPerServing: 14,
    carbsPerServing: 65,
    fatPerServing: 8,
    dietaryTags: ["vegan", "vegetarian", "kosher", "halal"],
    mealTags: ["traditional", "festive"],
    occasionTags: ["weekend", "celebration"],
    allergens: ["gluten"],
    instructions: [
      "Préparer le bouillon aux épices",
      "Couper tous les légumes",
      "Cuire les légumes selon leur temps de cuisson",
      "Préparer la semoule à la vapeur",
      "Servir avec bouillon et harissa"
    ],
    tips: ["Respecter l'ordre de cuisson des légumes"],
    equipment: ["couscoussier", "couteaux"],
    suggestedDrink: "Thé à la menthe",
    suggestedSides: ["Harissa", "Mergez végétariennes"],
    canMakeAhead: true,
    freezable: true,
    leftoverDays: 3
  },

  // Desserts légers
  {
    name: "Mousse au chocolat vegan",
    description: "Mousse légère et aérienne sans œufs ni crème",
    servings: 4,
    prepTime: 15,
    cookTime: 0,
    totalTime: 15,
    difficulty: "medium",
    mealType: "dinner_adults",
    audience: "both",
    cuisine: "française",
    caloriesPerServing: 220,
    proteinPerServing: 4,
    carbsPerServing: 28,
    fatPerServing: 12,
    dietaryTags: ["vegan", "vegetarian", "kosher"],
    mealTags: ["sweet", "light"],
    occasionTags: ["dessert", "special"],
    allergens: [],
    instructions: [
      "Faire fondre le chocolat au bain-marie",
      "Monter le jus de haricots en neige",
      "Incorporer délicatement au chocolat fondu",
      "Ajouter sucre et vanille",
      "Réfrigérer 2 heures minimum"
    ],
    tips: ["Le jus de haricots doit être bien froid"],
    equipment: ["mixeur", "bain-marie"],
    suggestedDrink: "Café",
    suggestedSides: ["Fruits rouges", "Biscuits"],
    canMakeAhead: true,
    freezable: false,
    leftoverDays: 2
  }
];

// Fonction pour créer une recette avec ses ingrédients
async function createRecipeWithIngredients(recipeData) {
  try {
    // Créer la recette de base
    const recipe = await prisma.recipe.create({
      data: {
        name: recipeData.name,
        description: recipeData.description,
        servings: recipeData.servings,
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        totalTime: recipeData.totalTime,
        difficulty: recipeData.difficulty,
        mealType: recipeData.mealType,
        audience: recipeData.audience,
        cuisine: recipeData.cuisine,
        caloriesPerServing: recipeData.caloriesPerServing,
        proteinPerServing: recipeData.proteinPerServing,
        carbsPerServing: recipeData.carbsPerServing,
        fatPerServing: recipeData.fatPerServing,
        dietaryTags: recipeData.dietaryTags,
        mealTags: recipeData.mealTags,
        occasionTags: recipeData.occasionTags,
        allergens: recipeData.allergens,
        instructions: recipeData.instructions,
        tips: recipeData.tips,
        equipment: recipeData.equipment,
        suggestedDrink: recipeData.suggestedDrink,
        suggestedSides: recipeData.suggestedSides,
        canMakeAhead: recipeData.canMakeAhead,
        freezable: recipeData.freezable,
        leftoverDays: recipeData.leftoverDays
      }
    });
    
    console.log(`✅ Recette créée: ${recipe.name}`);
    return recipe;
  } catch (error) {
    console.error(`❌ Erreur création recette ${recipeData.name}:`, error.message);
    return null;
  }
}

async function addAllRecipes() {
  console.log("🍳 Ajout de 40 nouvelles recettes...");
  
  try {
    // Combiner toutes les recettes
    const allRecipes = [...newRecipes, ...moreRecipes];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const recipeData of allRecipes) {
      const recipe = await createRecipeWithIngredients(recipeData);
      if (recipe) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Petite pause pour éviter de surcharger la DB
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Résumé:`);
    console.log(`✅ ${successCount} recettes ajoutées avec succès`);
    console.log(`❌ ${errorCount} erreurs`);
    
  } catch (error) {
    console.error("💥 Erreur générale:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'ajout
if (require.main === module) {
  addAllRecipes()
    .then(() => {
      console.log("🏁 Ajout des recettes terminé !");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Échec:", error);
      process.exit(1);
    });
}

module.exports = { addAllRecipes };