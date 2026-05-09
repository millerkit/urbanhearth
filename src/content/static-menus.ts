// ── Sample / fallback menu ────────────────────────────────────────────────────────
// Shown ONLY when the Storyblok API is unavailable or the token is not configured.
// A visible warning banner and a "SAMPLE" watermark are rendered alongside this
// data so visitors know it may not reflect today's actual menu.
// The live menu is always sourced from Storyblok — do NOT silently swap this in.
export const staticMenuSections = [
  {
    title: "Shared Plates",
    items: [
      {
        name: "Unicorn Oysters on the Half Shell",
        price: "4 ea",
        description: "Blueberry vinegar · long pepper mignonette",
      },
      {
        name: "New England Lamb Beignets",
        price: "8 ea",
        description:
          "Moroccan spiced lamb · lamb heart pastrami · spring herb salad",
      },
      {
        name: "Hake Crudo in Hibiscus Leche de Tigre",
        price: "26",
        description: "Crispy leek · pickled green strawberry · summer truffle",
      },
      {
        name: "Duck Liver Mousse",
        price: "22",
        description:
          "Blueberry mostarda · pickled radish · pistachio · rye cracker",
      },
      {
        name: "Vadouvan Carrot Brûlette",
        price: "28",
        description: "Savory & butter · sheep maldon · fried mushrooms",
      },
      {
        name: "Grilled Asparagus & Spring Forage Pistou",
        price: "26",
        description: "Cultured sheep's milk cheese · basil · fried capers",
      },
      {
        name: "Blistered Kale with Whipped Tahini",
        price: "28",
        description:
          "Friqule · sichuan sesame crisp · pickled apple · fermented chili",
      },
      {
        name: "Lovage Crème Brûlée with Sugar Snaps",
        price: "30",
        description: "Clothbound cheddar · rye soil · pea tendrils",
      },
      {
        name: "Juniper Rubbed Swordfish",
        price: "42",
        description: "Parsnip crème · blistered grape · tender herbs",
      },
      {
        name: "Chicken & Wild Mushrooms in Red Wine",
        price: "44",
        description: "Thomas Farm · pomelo preserve · pickled onion",
      },
    ],
  },
  {
    title: "Breads & Charcuterie",
    items: [
      {
        name: "Warm Mediterranean Olives",
        price: "8",
        description: "Olive oil · preserved lemon · chili",
      },
      {
        name: "Big Buttermilk Biscuit",
        price: "8",
        description: "Smoked maple brown butter",
      },
      {
        name: "Grilled Sourdough Focaccia",
        price: "8",
        description: "Du lot spice · olive oil",
      },
      {
        name: "New England Nosh Board",
        price: "29",
        description:
          "A selection of local cheeses and charcuterie, served with crackers and crudités",
        note: "Cheeses: hardwood thyme (NH) · camembert (NY) · great hill blue (MA) · jasper hill cheddar (VT) · truffle manchego (VT) — Charcuterie: mortadella · prosciutto di parma · n'duja",
      },
    ],
  },
];

export const staticChefsCounter = {
  price: "$160",
  winePairing: "+$70 per person",
  courses: [
    { label: "I", name: "Amuse-Bouche" },
    {
      label: "II",
      name: "Crudo & Garden",
      description:
        "Raw or lightly cured fish · seasonal vegetable · cold pressed oil",
    },
    {
      label: "III",
      name: "The Hearth Course",
      description:
        "Wood-fired preparation · preserved element · fermented accent",
    },
    {
      label: "IV",
      name: "Land & Sea",
      description: "Primary protein · root vegetable · foraged herb",
    },
    {
      label: "V",
      name: "Sweets",
      description: "Seasonal dessert · mignardises",
    },
  ],
  note: "Advanced reservations required. As the menu changes nightly, we cannot guarantee accommodation of all dietary restrictions.",
};
