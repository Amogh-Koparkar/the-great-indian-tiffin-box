/* ==========================================================================
   The Great Indian Tiffin Box · States & Union Territories Data
   --------------------------------------------------------------------------
   - INDIAN_STATES: 28 states in alphabetical order (4 columns of 7)
   - UNION_TERRITORIES: 8 Union Territories in alphabetical order (2 columns of 4)
   - STATE_RECIPES: Authentic recipes keyed by state name.
     Other states can be added here later without changing any application code.
   ========================================================================== */

window.INDIAN_STATES = [
  // Column 1 (7)
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  // Column 2 (7)
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  // Column 3 (7)
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  // Column 4 (7)
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

window.UNION_TERRITORIES = [
  // Column 1 (4)
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  // Column 2 (4)
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

window.STATE_RECIPES = {
  "Mizoram": {
    subtitle: "Gentle hills, smoky hearths, bamboo shoots, and comforting stews from the kitchens of Mizoram.",
    dishes: [
      {
        name: "Bai",
        description: "Mizoram's signature everyday vegetable stew, gently simmered with seasonal greens, bamboo shoots, pork fat or fermented soya, and a pinch of traditional alkaline water (chingal) without any frying or oil.",
        servings: "3–4",
        prepTime: "15 minutes",
        cookTime: "20 minutes",
        ingredients: [
          ["2 cups", "Mixed seasonal vegetables (mustard greens, French beans, brinjal, pumpkin leaves)"],
          ["½ cup", "Tender fermented or fresh bamboo shoots, finely shredded"],
          ["1 tbsp", "Bekang (fermented soybeans) or 2 tbsp finely diced pork fat (saum)"],
          ["½ tsp", "Baking soda (or 1 tbsp traditional chingal alkaline ash water)"],
          ["3–4", "Bird's eye green chilies (hmarcha), bruised"],
          ["1 inch", "Fresh ginger, lightly crushed"],
          ["3½ cups", "Water"],
          ["To taste", "Salt"]
        ],
        steps: [
          "Prepare the Broth: Bring 3½ cups of water to a rolling boil in a deep pot with salt and the baking soda (or chingal). The alkaline base keeps the greens vibrant and tender.",
          "Simmer Bamboo Shoots & Base: Add the shredded bamboo shoots, crushed ginger, and either the bekang or saum (pork fat). Let it simmer over medium heat for 5–6 minutes so the broth turns aromatic and slightly milky.",
          "Cook Firm Vegetables: Add the firmer vegetables first (sliced brinjal and snapped French beans) and cook uncovered for 6–8 minutes until tender.",
          "Fold in Greens & Chilies: Stir in the mustard greens, pumpkin leaves, and bruised bird's eye chilies. Simmer for another 4–5 minutes until the greens wilt into a silky stew.",
          "Serve: Ladle piping hot into bowls alongside steamed white rice—never stir-fried or tempered with oil."
        ]
      },
      {
        name: "Vawksa Rep",
        description: "Smoked pork belly slow-boiled and tossed with fresh mustard greens, ginger, garlic, and fiery green chilies—rich, smoky, and deeply comforting.",
        servings: "3–4",
        prepTime: "15 minutes",
        cookTime: "35 minutes",
        ingredients: [
          ["500 g", "Traditional wood-smoked pork belly (vawksa rep), sliced into bite-sized pieces"],
          ["2 cups", "Fresh mustard greens (antam), washed and roughly chopped"],
          ["1 medium", "Onion, thinly sliced"],
          ["6 cloves", "Garlic, crushed"],
          ["1½ inch", "Fresh ginger, julienned"],
          ["4–5", "Green chilies, slit lengthwise"],
          ["2½ cups", "Warm water"],
          ["To taste", "Salt"]
        ],
        steps: [
          "Simmer the Smoked Pork: Place the sliced smoked pork in a heavy pot with 2½ cups of water, half the ginger, and salt. Cover and simmer on medium-low heat for 20–25 minutes until the pork is tender and renders its natural smoky fat.",
          "Aromatics: Once the water reduces to a light, glossy broth, add the crushed garlic, remaining ginger juliennes, sliced onion, and slit green chilies. Simmer for 5 minutes until fragrant.",
          "Wilt the Greens: Add the chopped mustard greens on top, cover for 3–4 minutes, then toss gently so the greens absorb the smoky pork juices while staying bright.",
          "Serve: Serve warm with steamed rice and a side of raw green chilies."
        ]
      },
      {
        name: "Arsa Buhchiar",
        description: "A soulful Mizo chicken-and-rice porridge slow-cooked in a single pot with shredded country chicken, ginger, and fresh herbs until creamy and restorative.",
        servings: "4",
        prepTime: "15 minutes",
        cookTime: "40 minutes",
        ingredients: [
          ["400 g", "Bone-in chicken (preferably country chicken), cut into medium pieces"],
          ["1 cup", "Short-grain white rice, washed and soaked for 15 minutes"],
          ["2 inches", "Fresh ginger, finely grated or crushed"],
          ["6 cloves", "Garlic, finely minced"],
          ["1 medium", "Onion, finely chopped"],
          ["3–4", "Green chilies, finely chopped"],
          ["6 cups", "Water or light chicken stock"],
          ["¼ cup", "Fresh coriander and spring onion greens, chopped"],
          ["1 tsp", "Crushed black pepper and salt to taste"]
        ],
        steps: [
          "Poach the Chicken: In a deep pot, combine the chicken pieces, 6 cups of water, half the crushed ginger, and salt. Bring to a boil, then simmer gently for 20 minutes until the chicken is cooked through.",
          "Shred the Meat: Remove the chicken pieces, let them cool slightly, shred the meat into bite-sized strips, and return both the shredded meat and bones to the simmering stock for extra depth.",
          "Cook the Rice Porridge: Drain the soaked rice and add it to the pot along with the chopped onion, garlic, and remaining ginger. Simmer uncovered on medium-low heat for 18–20 minutes, stirring frequently until the rice breaks down and thickens into a velvety porridge.",
          "Season & Finish: Stir in the chopped green chilies, black pepper, spring onion greens, and fresh coriander. Serve steaming hot."
        ]
      },
      {
        name: "Bekang",
        description: "Pungent, nutty fermented soybeans (bekang um) fire-roasted or mashed with char-blistered tomatoes, raw onions, ginger, and bird's eye chilies as a bold Mizo side dish (chawhmeh).",
        servings: "4",
        prepTime: "10 minutes",
        cookTime: "10 minutes",
        ingredients: [
          ["½ cup", "Bekang (traditional fermented soybeans)"],
          ["2 medium", "Ripe tomatoes"],
          ["4–5", "Bird's eye chilies (hmarcha), roasted"],
          ["1 small", "Red onion, finely chopped"],
          ["1 tsp", "Fresh ginger, finely grated"],
          ["2 tbsp", "Fresh coriander leaves, finely chopped"],
          ["To taste", "Salt"]
        ],
        steps: [
          "Roast the Tomatoes & Chilies: Char the whole tomatoes and bird's eye chilies directly over an open flame (or dry cast-iron pan) for 5–6 minutes until the skins blister and blacken. Peel off the charred tomato skins.",
          "Toast the Bekang: Warm the fermented soybeans in a dry pan over low heat for 2–3 minutes (or wrap in a leaf and warm over embers) until deeply aromatic.",
          "Mash Together: In a mortar or mixing bowl, coarsely pound the toasted bekang and roasted chilies with salt. Add the warm roasted tomatoes and mash until chunky and well blended.",
          "Fold in Fresh Aromatics: Mix in the finely chopped raw onion, grated ginger, and fresh coriander. Serve immediately as a punchy relish alongside rice and Bai."
        ]
      },
      {
        name: "Pork with Bamboo Shoots",
        description: "Succulent cubes of pork belly slow-braised with tangy fermented bamboo shoots (rawtuai), crushed garlic, and fiery chilies—a celebratory staple across Mizoram.",
        servings: "4",
        prepTime: "15 minutes",
        cookTime: "45 minutes",
        ingredients: [
          ["500 g", "Fresh pork belly with skin and fat, cut into 1½-inch cubes"],
          ["1 cup", "Fermented or tender bamboo shoots (rawtuai), sliced into thin strips"],
          ["8 cloves", "Garlic, roughly crushed"],
          ["1½ inch", "Fresh ginger, crushed"],
          ["4–5", "Fresh or smoked red and green chilies, slit"],
          ["2½ cups", "Water"],
          ["2 stalks", "Spring onion greens or local sawtooth coriander (bahkhawr), chopped"],
          ["To taste", "Salt"]
        ],
        steps: [
          "Braise the Pork: Place the cubed pork belly in a heavy pot with 2½ cups of water, crushed ginger, and salt. No added cooking oil is needed. Cover and cook on medium-low heat for 25–30 minutes until the pork becomes fork-tender.",
          "Add Bamboo Shoots: Stir in the drained bamboo shoot strips and slit chilies. Simmer for another 10 minutes so the tangy bamboo shoots cut through the richness of the pork.",
          "Infuse with Crushed Garlic: Add the freshly crushed garlic during the final 5 minutes of cooking—a classic Mizo technique that keeps the garlic punchy and fragrant as the gravy thickens.",
          "Garnish & Serve: Sprinkle with chopped bahkhawr (or coriander and spring onions) and serve hot with steamed rice."
        ]
      }
    ]
  }
};
