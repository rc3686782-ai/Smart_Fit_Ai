# SmartFit AI

Advanced AI-Powered Fitness, Workout Planning, BMI Assessment, and Machine Learning Nutrition Platform.

## 🚀 Key Features

- **Personalized AI Dashboard**: Live readiness scores, HRV baselines, sleep tracking, and real-time energy balance.
- **Body Mass Index (BMI) & Assessment**: Instant BMI calculation with category classification (*Normal weight*, *Overweight*, *Underweight*, *Obese*), healthy weight range recommendation, and tailored AI workout advice.
- **Goal-Adaptive Workout Planner**:
  - Goal selection (*Lose body fat*, *Build muscle*, *Improve endurance*, *Stay healthy*).
  - Target exercise routines with sets, reps, and rest periods.
  - Curated, embedded YouTube video workouts (MadFit, Juice & Toya, Jeff Nippard, etc.).
  - 1-Click logging directly into persistent workout history.
- **Scientific Calorie Deficit & Macro Diet Plan**:
  - BMR (Mifflin-St Jeor) and TDEE maintenance calculation.
  - Precise daily caloric deficit (-500 kcal/day) with projected weekly fat loss rates.
  - Interactive daily hydration & water intake tracker (+250ml glass logger).
  - Product-wise structured meal plan (Breakfast, Snack, Lunch, Evening Snack, Dinner) with macro density and nutritionist tips.
- **Natural Language ML Nutrition Estimator**:
  - Type ANY meal or ingredient combination in natural language (e.g. *"2 boiled eggs with 2 slices whole wheat toast and avocado"*).
  - Machine learning / NLP inference calculates total Calories, Protein, Carbohydrates, Fats, Fiber, and individual food item breakdowns.
  - Direct 1-click addition to today's logged meals.
- **Persistent Backend & Auth**:
  - File-based JSON database (`data/db.json`) surviving server restarts.
  - Secure PBKDF2 password hashing & session management.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5
- **UI / Styling**: Tailwind CSS v4, Lucide React icons
- **AI & ML**: Google Generative AI (`@ai-sdk/google`, Gemini 2.0 Flash) + Built-in Natural Language Nutrition NLP Engine
- **Storage**: Persistent JSON database (`data/db.json`)

## 🏁 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables** (Optional for Gemini AI features):
   Create a `.env.local` file:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here
   ```
   *(Note: The built-in NLP Nutrition model works 100% offline even without an API key!)*

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Visit [http://localhost:3000](http://localhost:3000)

## 📄 License

MIT
