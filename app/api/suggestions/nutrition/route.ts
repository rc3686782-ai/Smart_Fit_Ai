import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserIdFromSession, findUserById } from '@/lib/store'

export type FoodProductItem = {
  id: string
  product: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  waterMl: number
  productCategory: string
  whyChosen: string
}

export type MealSlot = {
  slotName: 'Breakfast' | 'Mid-Morning Snack' | 'Lunch' | 'Evening Snack' | 'Dinner'
  time: string
  targetCalories: number
  products: FoodProductItem[]
}

function calculateAge(dobStr?: string): number {
  if (!dobStr) return 26
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return 26
  const diff = Date.now() - dob.getTime()
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  return age > 10 && age < 100 ? age : 26
}

function getActivityMultiplier(activity?: string): number {
  if (!activity) return 1.375
  const act = activity.toLowerCase()
  if (act.includes('just') || act.includes('start') || act.includes('sedentary')) return 1.2
  if (act.includes('1') || act.includes('2')) return 1.375
  if (act.includes('3') || act.includes('4')) return 1.55
  if (act.includes('5') || act.includes('more')) return 1.725
  return 1.375
}

function getDietaryMealPlan(goal: string, diet: string, targetCalories: number): MealSlot[] {
  const isVeg = diet.toLowerCase().includes('veg') && !diet.toLowerCase().includes('pesc')
  const isVegan = diet.toLowerCase().includes('vegan')

  // Scaled food portions based on target calories
  const scale = targetCalories / 2000

  if (isVegan) {
    return [
      {
        slotName: 'Breakfast',
        time: '08:00 AM',
        targetCalories: Math.round(450 * scale),
        products: [
          {
            id: 'v-b1',
            product: 'Organic Rolled Oats cooked with Unsweetened Almond Milk',
            portion: `${Math.round(60 * scale)}g dry oats + 200ml almond milk`,
            calories: Math.round(260 * scale),
            protein: Math.round(10 * scale),
            carbs: Math.round(44 * scale),
            fat: Math.round(5 * scale),
            fiber: Math.round(7 * scale),
            waterMl: 250,
            productCategory: 'Complex Carbs & Fiber',
            whyChosen: 'Beta-glucan soluble fiber regulates blood glucose and prevents mid-morning appetite spikes.',
          },
          {
            id: 'v-b2',
            product: 'Plant-Based Pea & Brown Rice Protein Powder',
            portion: '1 scoop (30g)',
            calories: Math.round(120 * scale),
            protein: Math.round(24 * scale),
            carbs: Math.round(2 * scale),
            fat: Math.round(1.5 * scale),
            fiber: Math.round(1 * scale),
            waterMl: 300,
            productCategory: 'Plant Protein',
            whyChosen: 'Complete essential amino acid profile with high leucine to trigger muscle protein synthesis.',
          },
          {
            id: 'v-b3',
            product: 'Fresh Organic Blueberries & Ground Chia Seeds',
            portion: '50g berries + 1 tbsp chia',
            calories: Math.round(90 * scale),
            protein: Math.round(2.5 * scale),
            carbs: Math.round(11 * scale),
            fat: Math.round(4.5 * scale),
            fiber: Math.round(5 * scale),
            waterMl: 50,
            productCategory: 'Antioxidants & Omega-3',
            whyChosen: 'Polyphenols reduce exercise-induced oxidative stress while chia provides ALA omega-3.',
          },
        ],
      },
      {
        slotName: 'Mid-Morning Snack',
        time: '11:00 AM',
        targetCalories: Math.round(220 * scale),
        products: [
          {
            id: 'v-s1',
            product: 'Raw California Almonds & Walnuts',
            portion: '25g handful',
            calories: Math.round(150 * scale),
            protein: Math.round(5 * scale),
            carbs: Math.round(5 * scale),
            fat: Math.round(13 * scale),
            fiber: Math.round(3 * scale),
            waterMl: 0,
            productCategory: 'Healthy Fats',
            whyChosen: 'Monounsaturated fats enhance fat-soluble vitamin absorption and hormonal health.',
          },
          {
            id: 'v-s2',
            product: 'Crisp Green Apple with Cinnamon',
            portion: '1 medium (150g)',
            calories: Math.round(75 * scale),
            protein: Math.round(0.5 * scale),
            carbs: Math.round(19 * scale),
            fat: Math.round(0.2 * scale),
            fiber: Math.round(4 * scale),
            waterMl: 120,
            productCategory: 'Pectin & Fruit Hydration',
            whyChosen: 'Pectin provides sustained satiety while cinnamon improves insulin receptor sensitivity.',
          },
        ],
      },
      {
        slotName: 'Lunch',
        time: '01:30 PM',
        targetCalories: Math.round(550 * scale),
        products: [
          {
            id: 'v-l1',
            product: 'Pan-Seared Organic Extra Firm Tofu or Tempeh',
            portion: `${Math.round(160 * scale)}g`,
            calories: Math.round(210 * scale),
            protein: Math.round(22 * scale),
            carbs: Math.round(4 * scale),
            fat: Math.round(11 * scale),
            fiber: Math.round(2 * scale),
            waterMl: 100,
            productCategory: 'Lean Plant Protein',
            whyChosen: 'Rich in bioavailable isoflavones, iron, and calcium to preserve muscle during fat loss.',
          },
          {
            id: 'v-l2',
            product: 'Steamed Tri-Color Quinoa',
            portion: `${Math.round(120 * scale)}g cooked`,
            calories: Math.round(150 * scale),
            protein: Math.round(5.5 * scale),
            carbs: Math.round(27 * scale),
            fat: Math.round(2.5 * scale),
            fiber: Math.round(3.5 * scale),
            waterMl: 80,
            productCategory: 'Ancient Grain',
            whyChosen: 'Naturally gluten-free complete protein grain providing slow-digesting complex energy.',
          },
          {
            id: 'v-l3',
            product: 'Steamed Broccoli, Zucchini & Bell Pepper Salad with Olive Oil',
            portion: '200g mixed veggies + 1 tsp EVOO',
            calories: Math.round(140 * scale),
            protein: Math.round(4 * scale),
            carbs: Math.round(12 * scale),
            fat: Math.round(5 * scale),
            fiber: Math.round(6 * scale),
            waterMl: 180,
            productCategory: 'Micronutrients & Volume',
            whyChosen: 'High food volume with minimal caloric load fills stomach stretch receptors.',
          },
        ],
      },
      {
        slotName: 'Evening Snack',
        time: '05:00 PM',
        targetCalories: Math.round(240 * scale),
        products: [
          {
            id: 'v-e1',
            product: 'Roasted Spiced Chickpeas (Hummus Crisp)',
            portion: '40g',
            calories: Math.round(150 * scale),
            protein: Math.round(7 * scale),
            carbs: Math.round(22 * scale),
            fat: Math.round(3 * scale),
            fiber: Math.round(6 * scale),
            waterMl: 20,
            productCategory: 'Pre-Workout Fuel',
            whyChosen: 'Slow-burning resistant starch fuels afternoon workout sessions without insulin crash.',
          },
          {
            id: 'v-e2',
            product: 'Pure Coconut Water with Electrolytes',
            portion: '250ml glass',
            calories: Math.round(45 * scale),
            protein: Math.round(0.5 * scale),
            carbs: Math.round(11 * scale),
            fat: Math.round(0 * scale),
            fiber: Math.round(0 * scale),
            waterMl: 250,
            productCategory: 'Natural Electrolyte Hydration',
            whyChosen: 'Potassium-rich hydration optimizes cellular fluid balance and muscular contractions.',
          },
        ],
      },
      {
        slotName: 'Dinner',
        time: '08:00 PM',
        targetCalories: Math.round(540 * scale),
        products: [
          {
            id: 'v-d1',
            product: 'Red Lentil & Yellow Split Pea Dahl with Turmeric & Ginger',
            portion: `${Math.round(200 * scale)}g cooked bowl`,
            calories: Math.round(240 * scale),
            protein: Math.round(18 * scale),
            carbs: Math.round(38 * scale),
            fat: Math.round(3 * scale),
            fiber: Math.round(9 * scale),
            waterMl: 150,
            productCategory: 'Legume Protein & Anti-inflammatory',
            whyChosen: 'Curcumin in turmeric accelerates exercise recovery and reduces delayed onset muscle soreness.',
          },
          {
            id: 'v-d2',
            product: 'Steamed Asparagus, Baby Spinach & Garlic Mushroom Stir-Fry',
            portion: '180g bowl',
            calories: Math.round(90 * scale),
            protein: Math.round(5 * scale),
            carbs: Math.round(10 * scale),
            fat: Math.round(2 * scale),
            fiber: Math.round(5 * scale),
            waterMl: 160,
            productCategory: 'Low-Calorie Nutrient Dense',
            whyChosen: 'Asparagus acts as a mild natural diuretic helping eliminate subcutaneous water retention.',
          },
          {
            id: 'v-d3',
            product: 'Hemp Heart Seeds (Shelled)',
            portion: '1.5 tbsp (15g)',
            calories: Math.round(85 * scale),
            protein: Math.round(5 * scale),
            carbs: Math.round(1.5 * scale),
            fat: Math.round(7 * scale),
            fiber: Math.round(1 * scale),
            waterMl: 0,
            productCategory: 'Essential Fatty Acids',
            whyChosen: 'Optimal 3:1 balance of omega-6 to omega-3 supports overnight cell regeneration.',
          },
        ],
      },
    ]
  }

  if (isVeg) {
    return [
      {
        slotName: 'Breakfast',
        time: '08:00 AM',
        targetCalories: Math.round(460 * scale),
        products: [
          {
            id: 'vg-b1',
            product: 'Low-Fat Greek Yogurt (Plain, 0-2% fat)',
            portion: `${Math.round(180 * scale)}g cup`,
            calories: Math.round(130 * scale),
            protein: Math.round(20 * scale),
            carbs: Math.round(7 * scale),
            fat: Math.round(2 * scale),
            fiber: 0,
            waterMl: 150,
            productCategory: 'Dairy Protein',
            whyChosen: 'Casein and whey blend supplies steady amino acids while probiotics enhance gut microbiome.',
          },
          {
            id: 'vg-b2',
            product: 'Rolled Oats with Cinnamon & Chia Seeds',
            portion: `${Math.round(50 * scale)}g dry`,
            calories: Math.round(200 * scale),
            protein: Math.round(7 * scale),
            carbs: Math.round(35 * scale),
            fat: Math.round(4 * scale),
            fiber: Math.round(6 * scale),
            waterMl: 100,
            productCategory: 'Slow-Release Carbs',
            whyChosen: 'Low glycemic index prevents insulin surges that block lipolysis (fat burning).',
          },
          {
            id: 'vg-b3',
            product: 'Fresh Strawberries & Crushed Walnuts',
            portion: '60g berries + 10g walnuts',
            calories: Math.round(95 * scale),
            protein: Math.round(2 * scale),
            carbs: Math.round(8 * scale),
            fat: Math.round(7 * scale),
            fiber: Math.round(3 * scale),
            waterMl: 55,
            productCategory: 'Antioxidants & Healthy Fats',
            whyChosen: 'Anthocyanins in berries curb systemic inflammation and improve insulin response.',
          },
        ],
      },
      {
        slotName: 'Mid-Morning Snack',
        time: '11:00 AM',
        targetCalories: Math.round(200 * scale),
        products: [
          {
            id: 'vg-s1',
            product: 'Low-Fat Cottage Cheese (Paneer / Chenna)',
            portion: `${Math.round(100 * scale)}g`,
            calories: Math.round(105 * scale),
            protein: Math.round(14 * scale),
            carbs: Math.round(3.5 * scale),
            fat: Math.round(3 * scale),
            fiber: 0,
            waterMl: 80,
            productCategory: 'Sustained Release Protein',
            whyChosen: 'Pure micellar casein protects skeletal muscle from breakdown during caloric deficit.',
          },
          {
            id: 'vg-s2',
            product: 'English Cucumber Slices with Himalayan Pink Salt & Lemon',
            portion: '150g fresh',
            calories: 25,
            protein: 1,
            carbs: 5,
            fat: 0,
            fiber: 2,
            waterMl: 140,
            productCategory: 'Hydrating Vegetable',
            whyChosen: '96% water content provides stomach fullness and cellular hydration.',
          },
        ],
      },
      {
        slotName: 'Lunch',
        time: '01:30 PM',
        targetCalories: Math.round(560 * scale),
        products: [
          {
            id: 'vg-l1',
            product: 'Grilled Spiced Paneer or Organic Tofu Steak',
            portion: `${Math.round(120 * scale)}g`,
            calories: Math.round(240 * scale),
            protein: Math.round(22 * scale),
            carbs: Math.round(5 * scale),
            fat: Math.round(14 * scale),
            fiber: Math.round(1 * scale),
            waterMl: 70,
            productCategory: 'Complete Vegetarian Protein',
            whyChosen: 'Provides essential amino acids and calcium for muscle contractions and bone density.',
          },
          {
            id: 'vg-l2',
            product: 'Brown Basmati Rice or Cooked Quinoa',
            portion: `${Math.round(130 * scale)}g cooked`,
            calories: Math.round(160 * scale),
            protein: Math.round(4 * scale),
            carbs: Math.round(34 * scale),
            fat: Math.round(1.5 * scale),
            fiber: Math.round(3 * scale),
            waterMl: 90,
            productCategory: 'Wholesome Grains',
            whyChosen: 'Supplies B-vitamins and magnesium needed for mitochondrial energy production.',
          },
          {
            id: 'vg-l3',
            product: 'Steamed Spinach & Garbanzo Chickpeas with Cumin & Olive Oil',
            portion: '150g bowl',
            calories: Math.round(140 * scale),
            protein: Math.round(6 * scale),
            carbs: Math.round(18 * scale),
            fat: Math.round(4 * scale),
            fiber: Math.round(6 * scale),
            waterMl: 110,
            productCategory: 'Micronutrient Powerhouse',
            whyChosen: 'High in non-heme iron and folate, essential for oxygen transport in working muscles.',
          },
        ],
      },
      {
        slotName: 'Evening Snack',
        time: '05:00 PM',
        targetCalories: Math.round(220 * scale),
        products: [
          {
            id: 'vg-e1',
            product: 'Whey Protein Isolate Shake in Water',
            portion: '1 scoop (30g)',
            calories: Math.round(115 * scale),
            protein: Math.round(25 * scale),
            carbs: Math.round(1.5 * scale),
            fat: Math.round(1 * scale),
            fiber: 0,
            waterMl: 300,
            productCategory: 'Fast-Absorbing Protein',
            whyChosen: 'Rapid peak in bloodstream amino acids (leucinemia) triggers muscle recovery immediately.',
          },
          {
            id: 'vg-e2',
            product: 'Roasted Makhana (Foxnuts) with Black Pepper',
            portion: '25g bowl',
            calories: Math.round(90 * scale),
            protein: Math.round(3 * scale),
            carbs: Math.round(18 * scale),
            fat: Math.round(0.5 * scale),
            fiber: Math.round(2 * scale),
            waterMl: 0,
            productCategory: 'Crunchy Low-Calorie Snack',
            whyChosen: 'Low glycemic load and rich in potassium, ideal light fuel before evening workouts.',
          },
        ],
      },
      {
        slotName: 'Dinner',
        time: '08:00 PM',
        targetCalories: Math.round(520 * scale),
        products: [
          {
            id: 'vg-d1',
            product: 'Yellow Moong Dahl or Split Chickpea Curry with Fresh Coriander',
            portion: `${Math.round(200 * scale)}g bowl`,
            calories: Math.round(220 * scale),
            protein: Math.round(16 * scale),
            carbs: Math.round(33 * scale),
            fat: Math.round(3 * scale),
            fiber: Math.round(8 * scale),
            waterMl: 150,
            productCategory: 'Easily Digestible Legume',
            whyChosen: 'Moong dahl has one of the highest digestibility scores among plant pulses, preventing nighttime bloating.',
          },
          {
            id: 'vg-d2',
            product: 'Sautéed Mixed Vegetables (Zucchini, Broccoli, Bell Peppers)',
            portion: '180g portion',
            calories: Math.round(95 * scale),
            protein: Math.round(4 * scale),
            carbs: Math.round(12 * scale),
            fat: Math.round(3 * scale),
            fiber: Math.round(5 * scale),
            waterMl: 160,
            productCategory: 'Antioxidant Veggies',
            whyChosen: 'Cruciferous indoles support estrogen-testosterone balance and liver detoxification.',
          },
          {
            id: 'vg-d3',
            product: 'Whole Wheat Phulka or Gluten-Free Millet Roti',
            portion: '1 medium roti (35g dry)',
            calories: Math.round(95 * scale),
            protein: Math.round(3.5 * scale),
            carbs: Math.round(19 * scale),
            fat: Math.round(0.8 * scale),
            fiber: Math.round(3 * scale),
            waterMl: 10,
            productCategory: 'Traditional Whole Grain',
            whyChosen: 'Complex starch replenishes hepatic glycogen stores without spilling over into adipocytes.',
          },
        ],
      },
    ]
  }

  // Non-Veg / Balanced Standard Omnivore
  return [
    {
      slotName: 'Breakfast',
      time: '08:00 AM',
      targetCalories: Math.round(460 * scale),
      products: [
        {
          id: 'om-b1',
          product: 'Whole Omega-3 Egg + 3 Liquid Egg Whites (Scrambled or Poached)',
          portion: '1 whole + 3 whites (150g)',
          calories: Math.round(165 * scale),
          protein: Math.round(22 * scale),
          carbs: Math.round(1.5 * scale),
          fat: Math.round(7 * scale),
          fiber: 0,
          waterMl: 110,
          productCategory: 'Gold Standard Protein',
          whyChosen: '100% biological value protein rich in choline for cognitive focus and neurotransmitter synthesis.',
        },
        {
          id: 'om-b2',
          product: 'Toasted 100% Sprouted Whole Grain Sourdough Bread',
          portion: '1 thick slice (45g)',
          calories: Math.round(110 * scale),
          protein: Math.round(5 * scale),
          carbs: Math.round(20 * scale),
          fat: Math.round(1 * scale),
          fiber: Math.round(3.5 * scale),
          waterMl: 15,
          productCategory: 'Sprouted Complex Carbs',
          whyChosen: 'Sprouting breaks down phytates, increasing bioavailability of zinc, iron, and B-vitamins.',
        },
        {
          id: 'om-b3',
          product: 'Fresh Hass Avocado Slice & Half Grapefruit',
          portion: '35g avocado + 100g grapefruit',
          calories: Math.round(110 * scale),
          protein: Math.round(1.5 * scale),
          carbs: Math.round(12 * scale),
          fat: Math.round(6 * scale),
          fiber: Math.round(4 * scale),
          waterMl: 110,
          productCategory: 'Monounsaturated Fats & Vitamin C',
          whyChosen: 'Naringin flavonoid in grapefruit supports fat oxidation while oleic acid promotes satiety.',
        },
      ],
    },
    {
      slotName: 'Mid-Morning Snack',
      time: '11:00 AM',
      targetCalories: Math.round(210 * scale),
      products: [
        {
          id: 'om-s1',
          product: 'Authentic 0% Fat Icelandic Skyr or Greek Yogurt',
          portion: `${Math.round(150 * scale)}g`,
          calories: Math.round(100 * scale),
          protein: Math.round(17 * scale),
          carbs: Math.round(5 * scale),
          fat: Math.round(0.5 * scale),
          fiber: 0,
          waterMl: 120,
          productCategory: 'Fermented High Protein Dairy',
          whyChosen: 'Dense casein protein shuts down ghrelin (hunger hormone) until lunch.',
        },
        {
          id: 'om-s2',
          product: 'Organic Handful of Raw Almonds & Blueberries',
          portion: '15g almonds + 40g berries',
          calories: Math.round(110 * scale),
          protein: Math.round(3.5 * scale),
          carbs: Math.round(8 * scale),
          fat: Math.round(7.5 * scale),
          fiber: Math.round(2.5 * scale),
          waterMl: 35,
          productCategory: 'Brain & Cardiovascular Fuel',
          whyChosen: 'Vitamin E protects cell membranes from free radical damage during fat reduction.',
        },
      ],
    },
    {
      slotName: 'Lunch',
      time: '01:30 PM',
      targetCalories: Math.round(580 * scale),
      products: [
        {
          id: 'om-l1',
          product: 'Herb-Marinated Grilled Boneless Skinless Chicken Breast',
          portion: `${Math.round(170 * scale)}g cooked`,
          calories: Math.round(240 * scale),
          protein: Math.round(44 * scale),
          carbs: 0,
          fat: Math.round(5 * scale),
          fiber: 0,
          waterMl: 110,
          productCategory: 'Ultra-Lean Animal Protein',
          whyChosen: 'Highest thermic effect of food (TEF)—burning 25-30% of its calories just during digestion.',
        },
        {
          id: 'om-l2',
          product: 'Roasted Sweet Potato Wedges with Rosemary & Paprika',
          portion: `${Math.round(150 * scale)}g`,
          calories: Math.round(140 * scale),
          protein: Math.round(2.5 * scale),
          carbs: Math.round(32 * scale),
          fat: Math.round(0.5 * scale),
          fiber: Math.round(4.5 * scale),
          waterMl: 110,
          productCategory: 'Complex Starch & Beta-Carotene',
          whyChosen: 'Replenishes glycogen in skeletal muscle while delivering beta-carotene for immune health.',
        },
        {
          id: 'om-l3',
          product: 'Steamed French Green Beans & Asparagus in Extra Virgin Olive Oil',
          portion: '150g vegetables + 1 tsp EVOO',
          calories: Math.round(110 * scale),
          protein: Math.round(3 * scale),
          carbs: Math.round(10 * scale),
          fat: Math.round(5 * scale),
          fiber: Math.round(5 * scale),
          waterMl: 135,
          productCategory: 'Fibrous Greens',
          whyChosen: 'Prebiotic fibers nurture healthy gut bacteria, reducing visceral adipose tissue inflammation.',
        },
      ],
    },
    {
      slotName: 'Evening Snack',
      time: '05:00 PM',
      targetCalories: Math.round(230 * scale),
      products: [
        {
          id: 'om-e1',
          product: 'Micro-Filtered Whey Protein Isolate with Water',
          portion: '1 scoop (30g powder)',
          calories: Math.round(120 * scale),
          protein: Math.round(26 * scale),
          carbs: Math.round(1 * scale),
          fat: Math.round(1 * scale),
          fiber: 0,
          waterMl: 300,
          productCategory: 'Pure Whey Isolate',
          whyChosen: '90%+ protein by weight with virtually zero lactose, sugar, or fat.',
        },
        {
          id: 'om-e2',
          product: 'Crisp Red Apple with 1 tbsp Pure Peanut Butter',
          portion: '1 small apple + 12g peanut butter',
          calories: Math.round(135 * scale),
          protein: Math.round(3.5 * scale),
          carbs: Math.round(17 * scale),
          fat: Math.round(6 * scale),
          fiber: Math.round(3.5 * scale),
          waterMl: 90,
          productCategory: 'Pre-Workout Snack',
          whyChosen: 'Balanced fructose and healthy lipid ratio powers vigorous physical training.',
        },
      ],
    },
    {
      slotName: 'Dinner',
      time: '08:00 PM',
      targetCalories: Math.round(550 * scale),
      products: [
        {
          id: 'om-d1',
          product: 'Pan-Seared Wild Alaskan Salmon Fillet with Lemon Dill',
          portion: `${Math.round(160 * scale)}g`,
          calories: Math.round(280 * scale),
          protein: Math.round(34 * scale),
          carbs: 0,
          fat: Math.round(14 * scale),
          fiber: 0,
          waterMl: 100,
          productCategory: 'Cold-Water Fatty Fish',
          whyChosen: 'Loaded with EPA/DHA omega-3 fatty acids that sensitize cell membranes to insulin and reduce joint soreness.',
        },
        {
          id: 'om-d2',
          product: 'Steamed Tri-Color Quinoa or Brown Jasmine Rice',
          portion: `${Math.round(110 * scale)}g cooked`,
          calories: Math.round(140 * scale),
          protein: Math.round(4.5 * scale),
          carbs: Math.round(26 * scale),
          fat: Math.round(2 * scale),
          fiber: Math.round(3 * scale),
          waterMl: 75,
          productCategory: 'Low-GI Carbohydrates',
          whyChosen: 'Triggers mild serotonin release in the brain promoting deep Stage 3 and REM sleep.',
        },
        {
          id: 'om-d3',
          product: 'Charred Broccoli Florets with Minced Garlic & Sea Salt',
          portion: '160g portion',
          calories: Math.round(70 * scale),
          protein: Math.round(4 * scale),
          carbs: Math.round(10 * scale),
          fat: Math.round(1.5 * scale),
          fiber: Math.round(5 * scale),
          waterMl: 140,
          productCategory: 'Cruciferous Greens',
          whyChosen: 'Sulforaphane compound activates the Nrf2 pathway, enhancing cellular detox overnight.',
        },
      ],
    },
  ]
}

async function getUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sf_session')?.value
  if (!sessionId) return null
  const userId = getUserIdFromSession(sessionId)
  if (!userId) return null
  return findUserById(userId) ?? null
}

export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const profile = user.profile ?? {}
    const { searchParams } = new URL(request.url)
    const goal = searchParams.get('goal') || profile.goal || 'Lose body fat'

    const unit = profile.unit || 'metric'
    let weightKg = Number(profile.weight) || 70
    let heightCm = Number(profile.height) || 170

    if (unit === 'imperial') {
      weightKg = weightKg * 0.45359237
      heightCm = heightCm * 2.54
    }

    const age = calculateAge(profile.dob)
    const isMale = (profile.sex || '').toLowerCase().startsWith('m')
    const isFemale = (profile.sex || '').toLowerCase().startsWith('f')

    // Mifflin-St Jeor BMR
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age
    if (isMale) bmr += 5
    else if (isFemale) bmr -= 161
    else bmr -= 78
    bmr = Math.round(bmr)

    // TDEE Maintenance
    const activityMult = getActivityMultiplier(profile.activity)
    const tdee = Math.round(bmr * activityMult)

    // Goal Calorie Plan
    const gLower = goal.toLowerCase()
    let calorieDelta = -500
    let planType = 'Moderate Calorie Deficit'
    let targetCalories = Math.max(1300, tdee - 500)
    let projectedWeeklyChange = '-0.45 kg (-1.0 lb) pure fat loss / week'
    let planDescription = 'Creates a 500 kcal daily energy deficit that prompts your body to mobilize stored adipose tissue while high protein preserves lean muscle mass.'

    if (gLower.includes('muscle') || gLower.includes('strength') || gLower.includes('hypertrophy')) {
      calorieDelta = +250
      planType = 'Lean Hypertrophy Surplus'
      targetCalories = tdee + 250
      projectedWeeklyChange = '+0.25 kg (+0.55 lb) lean tissue gain / week'
      planDescription = 'Supplies optimal amino acids and glycogen substrates to fuel progressive muscle hypertrophy without spilling over into excess fat accumulation.'
    } else if (gLower.includes('endurance') || gLower.includes('stamina') || gLower.includes('run')) {
      calorieDelta = 0
      planType = 'High-Glycogen Endurance Fueling'
      targetCalories = tdee
      projectedWeeklyChange = 'Weight maintenance with peak aerobic output'
      planDescription = 'Calibrated to match energy expenditure and maintain full glycogen stores for sustained cardiovascular performance.'
    } else if (gLower.includes('health') || gLower.includes('stay')) {
      calorieDelta = 0
      planType = 'Metabolic Equilibrium & Longevity'
      targetCalories = tdee
      projectedWeeklyChange = 'Stable weight & optimal metabolic biomarkers'
      planDescription = 'Focuses on micronutrient density, anti-inflammatory whole foods, and stable blood sugar control.'
    }

    // Macro Targets
    let proteinPct = 0.35
    let carbsPct = 0.35
    let fatPct = 0.30

    if (gLower.includes('muscle')) {
      proteinPct = 0.30
      carbsPct = 0.45
      fatPct = 0.25
    } else if (gLower.includes('endurance')) {
      proteinPct = 0.20
      carbsPct = 0.55
      fatPct = 0.25
    } else if (gLower.includes('health')) {
      proteinPct = 0.25
      carbsPct = 0.45
      fatPct = 0.30
    }

    const targetProteinG = Math.round((targetCalories * proteinPct) / 4)
    const targetCarbsG = Math.round((targetCalories * carbsPct) / 4)
    const targetFatG = Math.round((targetCalories * fatPct) / 9)

    // Water Intake Calculation
    // Base: 35ml per kg of bodyweight + 500ml exercise compensation
    const waterBaseMl = Math.round(weightKg * 35) + 500
    const waterTargetLiters = (waterBaseMl / 1000).toFixed(1)
    const waterGlasses = Math.round(waterBaseMl / 250) // 250ml per glass

    // Generate Meal Plan
    const dietPreference = profile.diet || 'No preference'
    const mealSlots = getDietaryMealPlan(goal, dietPreference, targetCalories)

    // Aggregate Product Totals across meal slots
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0
    let totalWaterMl = 0

    mealSlots.forEach((slot) => {
      slot.products.forEach((p) => {
        totalCalories += p.calories
        totalProtein += p.protein
        totalCarbs += p.carbs
        totalFat += p.fat
        totalFiber += p.fiber
        totalWaterMl += p.waterMl
      })
    })

    return NextResponse.json({
      goal,
      dietPreference,
      metabolism: {
        bmr,
        tdee,
        calorieDelta,
        targetCalories,
        planType,
        planDescription,
        projectedWeeklyChange,
      },
      targets: {
        calories: targetCalories,
        protein: targetProteinG,
        carbs: targetCarbsG,
        fat: targetFatG,
        waterLiters: Number(waterTargetLiters),
        waterGlasses,
      },
      productSummary: {
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber,
        totalWaterMl,
      },
      meals: mealSlots,
    })
  } catch (error) {
    console.error('[suggestions/nutrition GET]', error)
    return NextResponse.json({ error: 'Failed to generate nutrition plan.' }, { status: 500 })
  }
}
