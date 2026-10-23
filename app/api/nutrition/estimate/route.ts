import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserIdFromSession, findUserById } from '@/lib/store'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'

export type DetectedFoodItem = {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export type NutritionEstimateResponse = {
  success: boolean
  mealText: string
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  macroPercentages: {
    protein: number
    carbs: number
    fat: number
  }
  detectedItems: DetectedFoodItem[]
  healthScore: string
  summary: string
  source: 'gemini-ai' | 'ml-nutrition-engine'
}

// Comprehensive Food Nutrient Reference Database (per 1 standard unit or 100g)
type NutrientProfile = {
  aliases: string[]
  unit: string
  defaultQty: number
  calPerUnit: number
  pPerUnit: number
  cPerUnit: number
  fPerUnit: number
  fiberPerUnit: number
}

const NUTRITION_DATABASE: NutrientProfile[] = [
  // Proteins & Dairy
  { aliases: ['egg', 'boiled egg', 'poached egg', 'fried egg', 'scrambled egg'], unit: 'egg', defaultQty: 1, calPerUnit: 74, pPerUnit: 6.3, cPerUnit: 0.4, fPerUnit: 5.0, fiberPerUnit: 0 },
  { aliases: ['egg white', 'egg whites'], unit: 'egg white', defaultQty: 1, calPerUnit: 17, pPerUnit: 3.6, cPerUnit: 0.2, fPerUnit: 0.1, fiberPerUnit: 0 },
  { aliases: ['chicken breast', 'grilled chicken', 'baked chicken', 'chicken'], unit: '100g', defaultQty: 1.5, calPerUnit: 165, pPerUnit: 31, cPerUnit: 0, fPerUnit: 3.6, fiberPerUnit: 0 },
  { aliases: ['salmon', 'grilled salmon', 'wild salmon', 'fish'], unit: '100g', defaultQty: 1.5, calPerUnit: 206, pPerUnit: 22, cPerUnit: 0, fPerUnit: 12.3, fiberPerUnit: 0 },
  { aliases: ['tuna', 'canned tuna'], unit: '100g', defaultQty: 1.2, calPerUnit: 130, pPerUnit: 28, cPerUnit: 0, fPerUnit: 1.0, fiberPerUnit: 0 },
  { aliases: ['paneer', 'cottage cheese', 'cottage cheese paneer'], unit: '100g', defaultQty: 1.0, calPerUnit: 265, pPerUnit: 18, cPerUnit: 3.5, fPerUnit: 20, fiberPerUnit: 0 },
  { aliases: ['tofu', 'firm tofu'], unit: '100g', defaultQty: 1.5, calPerUnit: 144, pPerUnit: 15.5, cPerUnit: 2.8, fPerUnit: 8.7, fiberPerUnit: 2.3 },
  { aliases: ['whey protein', 'protein powder', 'whey isolate', 'protein shake'], unit: 'scoop (30g)', defaultQty: 1, calPerUnit: 120, pPerUnit: 25, cPerUnit: 2, fPerUnit: 1.2, fiberPerUnit: 0.5 },
  { aliases: ['greek yogurt', 'skyr', 'plain greek yogurt'], unit: 'cup (170g)', defaultQty: 1, calPerUnit: 130, pPerUnit: 17, cPerUnit: 6, fPerUnit: 2.5, fiberPerUnit: 0 },
  { aliases: ['milk', 'whole milk', 'cow milk'], unit: 'cup (240ml)', defaultQty: 1, calPerUnit: 150, pPerUnit: 8, cPerUnit: 12, fPerUnit: 8, fiberPerUnit: 0 },
  { aliases: ['almond milk', 'oat milk', 'soy milk'], unit: 'cup (240ml)', defaultQty: 1, calPerUnit: 40, pPerUnit: 1.5, cPerUnit: 2, fPerUnit: 3, fiberPerUnit: 1 },
  { aliases: ['cheddar cheese', 'cheese', 'mozzarella'], unit: 'slice (28g)', defaultQty: 1, calPerUnit: 110, pPerUnit: 7, cPerUnit: 0.5, fPerUnit: 9, fiberPerUnit: 0 },

  // Grains & Carbs
  { aliases: ['oats', 'oatmeal', 'rolled oats'], unit: 'bowl (50g dry)', defaultQty: 1, calPerUnit: 190, pPerUnit: 6.5, cPerUnit: 34, fPerUnit: 3.5, fiberPerUnit: 5 },
  { aliases: ['rice', 'white rice', 'cooked rice', 'basmati rice'], unit: 'cup cooked (150g)', defaultQty: 1, calPerUnit: 205, pPerUnit: 4.2, cPerUnit: 45, fPerUnit: 0.4, fiberPerUnit: 0.6 },
  { aliases: ['brown rice'], unit: 'cup cooked (150g)', defaultQty: 1, calPerUnit: 215, pPerUnit: 5.0, cPerUnit: 45, fPerUnit: 1.8, fiberPerUnit: 3.5 },
  { aliases: ['quinoa'], unit: 'cup cooked (185g)', defaultQty: 1, calPerUnit: 222, pPerUnit: 8.1, cPerUnit: 39, fPerUnit: 3.6, fiberPerUnit: 5.2 },
  { aliases: ['bread', 'slice of bread', 'toast', 'whole wheat bread', 'sourdough'], unit: 'slice', defaultQty: 2, calPerUnit: 80, pPerUnit: 4, cPerUnit: 15, fPerUnit: 1, fiberPerUnit: 2 },
  { aliases: ['roti', 'chapati', 'phulka'], unit: 'roti (35g)', defaultQty: 2, calPerUnit: 95, pPerUnit: 3.5, cPerUnit: 19, fPerUnit: 1.2, fiberPerUnit: 3 },
  { aliases: ['naan', 'butter naan'], unit: 'piece (100g)', defaultQty: 1, calPerUnit: 290, pPerUnit: 8.5, cPerUnit: 50, fPerUnit: 6.5, fiberPerUnit: 2.2 },
  { aliases: ['pasta', 'spaghetti', 'macaroni'], unit: 'cup cooked (140g)', defaultQty: 1, calPerUnit: 220, pPerUnit: 8, cPerUnit: 43, fPerUnit: 1.3, fiberPerUnit: 2.5 },
  { aliases: ['potato', 'baked potato', 'boiled potato'], unit: 'medium (170g)', defaultQty: 1, calPerUnit: 160, pPerUnit: 4.3, cPerUnit: 37, fPerUnit: 0.2, fiberPerUnit: 4 },
  { aliases: ['sweet potato'], unit: 'medium (130g)', defaultQty: 1, calPerUnit: 112, pPerUnit: 2.0, cPerUnit: 26, fPerUnit: 0.1, fiberPerUnit: 3.9 },

  // Legumes & Pulses
  { aliases: ['lentils', 'dahl', 'dal', 'yellow dal', 'moong dal'], unit: 'bowl cooked (200g)', defaultQty: 1, calPerUnit: 230, pPerUnit: 16, cPerUnit: 38, fPerUnit: 1.5, fiberPerUnit: 14 },
  { aliases: ['chickpeas', 'chole', 'garbanzo beans'], unit: 'cup cooked (164g)', defaultQty: 1, calPerUnit: 269, pPerUnit: 14.5, cPerUnit: 45, fPerUnit: 4.2, fiberPerUnit: 12.5 },
  { aliases: ['black beans', 'beans', 'kidney beans', 'rajma'], unit: 'cup cooked (170g)', defaultQty: 1, calPerUnit: 225, pPerUnit: 15, cPerUnit: 40, fPerUnit: 0.9, fiberPerUnit: 15 },

  // Healthy Fats & Nuts
  { aliases: ['avocado'], unit: 'half avocado (100g)', defaultQty: 1, calPerUnit: 160, pPerUnit: 2, cPerUnit: 8.5, fPerUnit: 14.7, fiberPerUnit: 6.7 },
  { aliases: ['peanut butter', 'almond butter'], unit: 'tbsp (16g)', defaultQty: 1, calPerUnit: 95, pPerUnit: 4, cPerUnit: 3, fPerUnit: 8, fiberPerUnit: 1 },
  { aliases: ['almonds', 'nuts', 'walnuts', 'cashews'], unit: 'handful (28g)', defaultQty: 1, calPerUnit: 164, pPerUnit: 6, cPerUnit: 6, fPerUnit: 14, fiberPerUnit: 3.5 },
  { aliases: ['olive oil', 'butter', 'ghee', 'oil'], unit: 'tbsp (14g)', defaultQty: 1, calPerUnit: 120, pPerUnit: 0, cPerUnit: 0, fPerUnit: 14, fiberPerUnit: 0 },
  { aliases: ['chia seeds', 'flax seeds'], unit: 'tbsp (12g)', defaultQty: 1, calPerUnit: 58, pPerUnit: 2, cPerUnit: 5, fPerUnit: 3.8, fiberPerUnit: 4 },

  // Fruits & Vegetables
  { aliases: ['apple', 'green apple'], unit: 'medium apple', defaultQty: 1, calPerUnit: 95, pPerUnit: 0.5, cPerUnit: 25, fPerUnit: 0.3, fiberPerUnit: 4.4 },
  { aliases: ['banana'], unit: 'medium banana', defaultQty: 1, calPerUnit: 105, pPerUnit: 1.3, cPerUnit: 27, fPerUnit: 0.4, fiberPerUnit: 3.1 },
  { aliases: ['berries', 'blueberries', 'strawberries'], unit: 'cup (150g)', defaultQty: 1, calPerUnit: 84, pPerUnit: 1.1, cPerUnit: 21, fPerUnit: 0.5, fiberPerUnit: 3.6 },
  { aliases: ['broccoli'], unit: 'cup cooked (150g)', defaultQty: 1, calPerUnit: 55, pPerUnit: 3.7, cPerUnit: 11, fPerUnit: 0.6, fiberPerUnit: 5.1 },
  { aliases: ['spinach'], unit: 'cup cooked (180g)', defaultQty: 1, calPerUnit: 41, pPerUnit: 5.3, cPerUnit: 6.7, fPerUnit: 0.5, fiberPerUnit: 4.3 },
  { aliases: ['salad', 'green salad', 'mixed greens'], unit: 'bowl (100g)', defaultQty: 1, calPerUnit: 35, pPerUnit: 2, cPerUnit: 6, fPerUnit: 0.5, fiberPerUnit: 3 },

  // Prepared Meals & Combos
  { aliases: ['biryani', 'chicken biryani', 'mutton biryani'], unit: 'plate (350g)', defaultQty: 1, calPerUnit: 520, pPerUnit: 28, cPerUnit: 65, fPerUnit: 16, fiberPerUnit: 3.5 },
  { aliases: ['burger', 'cheeseburger', 'beef burger'], unit: 'sandwich', defaultQty: 1, calPerUnit: 480, pPerUnit: 26, cPerUnit: 42, fPerUnit: 22, fiberPerUnit: 2 },
  { aliases: ['pizza', 'slice of pizza', 'cheese pizza'], unit: 'slice', defaultQty: 2, calPerUnit: 280, pPerUnit: 12, cPerUnit: 32, fPerUnit: 11, fiberPerUnit: 1.5 },
  { aliases: ['sandwich', 'turkey sandwich', 'subway'], unit: 'sandwich', defaultQty: 1, calPerUnit: 360, pPerUnit: 22, cPerUnit: 44, fPerUnit: 10, fiberPerUnit: 4 },
  { aliases: ['paneer butter masala', 'shahi paneer'], unit: 'bowl (250g)', defaultQty: 1, calPerUnit: 380, pPerUnit: 14, cPerUnit: 14, fPerUnit: 28, fiberPerUnit: 2.5 },
  { aliases: ['dosa', 'masala dosa'], unit: 'piece with sambar', defaultQty: 1, calPerUnit: 320, pPerUnit: 8, cPerUnit: 52, fPerUnit: 9, fiberPerUnit: 4 },
  { aliases: ['idli'], unit: '2 pieces', defaultQty: 1, calPerUnit: 130, pPerUnit: 4, cPerUnit: 26, fPerUnit: 0.5, fiberPerUnit: 2 },
  { aliases: ['burrito', 'chicken burrito'], unit: 'wrap', defaultQty: 1, calPerUnit: 680, pPerUnit: 34, cPerUnit: 82, fPerUnit: 22, fiberPerUnit: 9 },
  { aliases: ['french fries', 'fries'], unit: 'medium portion (117g)', defaultQty: 1, calPerUnit: 365, pPerUnit: 4, cPerUnit: 48, fPerUnit: 17, fiberPerUnit: 4 },
]

/**
 * Natural Language / Rule-Based ML Food Parsing Engine
 */
function parseMealNLP(text: string): { items: DetectedFoodItem[]; rawSummary: string } {
  const normalized = text.toLowerCase()
  const foundItems: DetectedFoodItem[] = []

  // Tokenize clauses separated by commas, "and", "+", "&", "with"
  const segments = normalized.split(/,|\band\b|\+|\bwith\b|;/gi).map(s => s.trim()).filter(Boolean)

  for (const seg of segments) {
    // Extract quantity multiplier
    let qty = 1
    const numMatch = seg.match(/\b(\d+(?:\.\d+)?)\s*(?:g|grams?|scoops?|cups?|slices?|pieces?|eggs?|plates?|bowls?|tbsp|ml)?\b/)
    if (numMatch && numMatch[1]) {
      const parsedNum = parseFloat(numMatch[1])
      if (parsedNum > 0) {
        if (seg.includes('g') && parsedNum > 20) {
          // Grams specified (e.g. 200g)
          qty = parsedNum / 100
        } else if (parsedNum < 15) {
          qty = parsedNum
        }
      }
    } else if (seg.includes('half') || seg.includes('1/2')) {
      qty = 0.5
    } else if (seg.includes('double') || seg.includes('two')) {
      qty = 2
    } else if (seg.includes('three')) {
      qty = 3
    }

    // Match best database entry
    let bestMatch: NutrientProfile | null = null
    let bestLen = 0

    for (const entry of NUTRITION_DATABASE) {
      for (const alias of entry.aliases) {
        if (seg.includes(alias) && alias.length > bestLen) {
          bestMatch = entry
          bestLen = alias.length
        }
      }
    }

    if (bestMatch) {
      const finalQty = qty > 0 ? qty : bestMatch.defaultQty
      foundItems.push({
        name: bestMatch.aliases[0].charAt(0).toUpperCase() + bestMatch.aliases[0].slice(1),
        quantity: `${finalQty} x ${bestMatch.unit}`,
        calories: Math.round(bestMatch.calPerUnit * finalQty),
        protein: Math.round(bestMatch.pPerUnit * finalQty * 10) / 10,
        carbs: Math.round(bestMatch.cPerUnit * finalQty * 10) / 10,
        fat: Math.round(bestMatch.fPerUnit * finalQty * 10) / 10,
        fiber: Math.round(bestMatch.fiberPerUnit * finalQty * 10) / 10,
      })
    }
  }

  // If no specific segment matched, search whole text for any database item
  if (foundItems.length === 0) {
    for (const entry of NUTRITION_DATABASE) {
      for (const alias of entry.aliases) {
        if (normalized.includes(alias)) {
          foundItems.push({
            name: entry.aliases[0].charAt(0).toUpperCase() + entry.aliases[0].slice(1),
            quantity: `1 x ${entry.unit}`,
            calories: Math.round(entry.calPerUnit * entry.defaultQty),
            protein: Math.round(entry.pPerUnit * entry.defaultQty * 10) / 10,
            carbs: Math.round(entry.cPerUnit * entry.defaultQty * 10) / 10,
            fat: Math.round(entry.fPerUnit * entry.defaultQty * 10) / 10,
            fiber: Math.round(entry.fiberPerUnit * entry.defaultQty * 10) / 10,
          })
          break
        }
      }
    }
  }

  // Fallback if completely unknown dish
  if (foundItems.length === 0) {
    foundItems.push({
      name: text.trim(),
      quantity: '1 standard meal portion',
      calories: 380,
      protein: 18,
      carbs: 45,
      fat: 12,
      fiber: 4,
    })
  }

  return {
    items: foundItems,
    rawSummary: `Parsed ${foundItems.length} ingredients from description.`,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mealText } = body

    if (!mealText || typeof mealText !== 'string' || !mealText.trim()) {
      return NextResponse.json({ error: 'Please enter a meal name or description.' }, { status: 400 })
    }

    const cleanText = mealText.trim()
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    // Try Google Gemini AI model if API key is configured
    if (apiKey && apiKey !== 'your_google_ai_api_key_here') {
      try {
        const prompt = `You are an expert nutritional science and dietetics AI model.
Analyze the following user-submitted meal or food description: "${cleanText}"
Calculate and return a JSON object with:
- "items": array of recognized ingredients with "name", "quantity", "calories", "protein", "carbs", "fat", "fiber".
- "totalCalories": integer sum of calories (kcal)
- "totalProtein": number in grams
- "totalCarbs": number in grams
- "totalFat": number in grams
- "totalFiber": number in grams
- "healthScore": rating string (e.g. "A+ - Excellent Lean Protein & Fiber", "B - Balanced Moderate Carbs", etc.)
- "summary": 1-2 sentence nutrition breakdown summary

Return ONLY the raw JSON without markdown code fences.`

        const response = await generateText({
          model: google('gemini-2.0-flash'),
          prompt,
          temperature: 0.2,
        })

        const raw = response.text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim()
        const parsed = JSON.parse(raw)

        const totalCals = Math.round(Number(parsed.totalCalories) || 0)
        const totalP = Math.round(Number(parsed.totalProtein) || 0)
        const totalC = Math.round(Number(parsed.totalCarbs) || 0)
        const totalF = Math.round(Number(parsed.totalFat) || 0)
        const totalFib = Math.round(Number(parsed.totalFiber) || 0)

        const totalGrams = (totalP * 4) + (totalC * 4) + (totalF * 9) || 1
        const proteinPct = Math.round(((totalP * 4) / totalGrams) * 100)
        const carbsPct = Math.round(((totalC * 4) / totalGrams) * 100)
        const fatPct = Math.round(((totalF * 9) / totalGrams) * 100)

        const result: NutritionEstimateResponse = {
          success: true,
          mealText: cleanText,
          totals: {
            calories: totalCals,
            protein: totalP,
            carbs: totalC,
            fat: totalF,
            fiber: totalFib,
          },
          macroPercentages: {
            protein: proteinPct,
            carbs: carbsPct,
            fat: fatPct,
          },
          detectedItems: parsed.items || [],
          healthScore: parsed.healthScore || 'Balanced',
          summary: parsed.summary || 'AI nutrition estimation completed.',
          source: 'gemini-ai',
        }

        return NextResponse.json(result)
      } catch (geminiError) {
        console.warn('[Gemini AI estimate failed, falling back to local ML engine]:', geminiError)
      }
    }

    // Built-in Natural Language ML Nutrition Engine
    const { items } = parseMealNLP(cleanText)

    let totalCals = 0
    let totalP = 0
    let totalC = 0
    let totalF = 0
    let totalFib = 0

    items.forEach(i => {
      totalCals += i.calories
      totalP += i.protein
      totalC += i.carbs
      totalF += i.fat
      totalFib += i.fiber
    })

    totalCals = Math.round(totalCals)
    totalP = Math.round(totalP * 10) / 10
    totalC = Math.round(totalC * 10) / 10
    totalF = Math.round(totalF * 10) / 10
    totalFib = Math.round(totalFib * 10) / 10

    const totalMacroCals = (totalP * 4) + (totalC * 4) + (totalF * 9) || 1
    const pPct = Math.round(((totalP * 4) / totalMacroCals) * 100)
    const cPct = Math.round(((totalC * 4) / totalMacroCals) * 100)
    const fPct = Math.round(((totalF * 9) / totalMacroCals) * 100)

    let score = 'Grade B: Balanced Fuel'
    if (pPct >= 30 && totalFib >= 5) score = 'Grade A: High Protein & Fiber Optimized'
    else if (pPct >= 35) score = 'Grade A: Lean Protein Powerhouse'
    else if (fPct >= 50) score = 'Grade C+: High Lipid Energy'
    else if (cPct >= 65) score = 'Grade B+: Glycogen & Fast Carbs'

    const result: NutritionEstimateResponse = {
      success: true,
      mealText: cleanText,
      totals: {
        calories: totalCals,
        protein: totalP,
        carbs: totalC,
        fat: totalF,
        fiber: totalFib,
      },
      macroPercentages: {
        protein: pPct,
        carbs: cPct,
        fat: fPct,
      },
      detectedItems: items,
      healthScore: score,
      summary: `Estimated ${totalCals} kcal with ${totalP}g protein, ${totalC}g carbs, and ${totalF}g fat from ${items.length} recognized components.`,
      source: 'ml-nutrition-engine',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[nutrition estimate]', error)
    return NextResponse.json({ error: 'Failed to estimate nutrition for this meal.' }, { status: 500 })
  }
}
