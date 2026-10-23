/**
 * File-based persistent store — data survives server restarts.
 * In production, swap this for Prisma + PostgreSQL or similar.
 */

import fs from 'fs'
import path from 'path'

export type WorkoutSession = {
  id: string
  userId: string
  type: string          // e.g. "Strength training"
  name: string          // e.g. "Upper body strength"
  durationMin: number
  intensity: 'Easy' | 'Moderate' | 'Hard'
  notes?: string
  date: string          // ISO date string
  completed: boolean
}

export type MealEntry = {
  id: string
  userId: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
  date: string          // ISO date string (YYYY-MM-DD)
  time: string          // HH:mm
}

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
  profile?: {
    dob?: string
    sex?: string
    height?: string
    weight?: string
    unit?: string
    goal?: string
    activity?: string
    training?: string
    diet?: string
  }
}

type DB = {
  users: Record<string, User>
  sessions: Record<string, string>       // sessionId -> userId
  workouts: Record<string, WorkoutSession>
  meals: Record<string, MealEntry>
}

// Path to the JSON file stored at project root /data/db.json
const DATA_DIR  = path.join(process.cwd(), 'data')
const DB_PATH   = path.join(DATA_DIR, 'db.json')

function readDB(): DB {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    if (!fs.existsSync(DB_PATH)) return { users: {}, sessions: {}, workouts: {}, meals: {} }
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    const db = JSON.parse(raw) as DB
    // Migrate old DBs that don't have workouts/meals yet
    if (!db.workouts) db.workouts = {}
    if (!db.meals)    db.meals    = {}
    return db
  } catch {
    return { users: {}, sessions: {}, workouts: {}, meals: {} }
  }
}

function writeDB(db: DB): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

/* ─── User helpers ───────────────────────────────────────────────────────── */

export function findUserByEmail(email: string): User | undefined {
  const db = readDB()
  return Object.values(db.users).find((u) => u.email === email.toLowerCase())
}

export function findUserById(id: string): User | undefined {
  const db = readDB()
  return db.users[id]
}

export function saveUser(user: User): void {
  const db = readDB()
  db.users[user.id] = user
  writeDB(db)
}

export function updateUserProfile(userId: string, profile: User['profile']): User | null {
  const db = readDB()
  const user = db.users[userId]
  if (!user) return null
  db.users[userId] = { ...user, profile }
  writeDB(db)
  return db.users[userId]
}

/* ─── Session helpers ────────────────────────────────────────────────────── */

export function createSession(userId: string): string {
  const db = readDB()
  const sessionId = crypto.randomUUID()
  db.sessions[sessionId] = userId
  writeDB(db)
  return sessionId
}

export function getUserIdFromSession(sessionId: string): string | undefined {
  const db = readDB()
  return db.sessions[sessionId]
}

export function deleteSession(sessionId: string): void {
  const db = readDB()
  delete db.sessions[sessionId]
  writeDB(db)
}

/* ─── Password helpers ───────────────────────────────────────────────────── */

/** PBKDF2 hash — much stronger than plain SHA-256. Still use bcrypt in production. */
export async function hashPassword(pw: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = process.env['PW_SALT'] || 'smartfit_dev_salt'
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ─── Workout helpers ────────────────────────────────────────────────────── */

export function saveWorkout(workout: WorkoutSession): WorkoutSession {
  const db = readDB()
  db.workouts[workout.id] = workout
  writeDB(db)
  return workout
}

export function getWorkoutsForUser(userId: string): WorkoutSession[] {
  const db = readDB()
  return Object.values(db.workouts)
    .filter((w) => w.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function deleteWorkout(id: string, userId: string): boolean {
  const db = readDB()
  if (!db.workouts[id] || db.workouts[id].userId !== userId) return false
  delete db.workouts[id]
  writeDB(db)
  return true
}

/* ─── Meal helpers ───────────────────────────────────────────────────────── */

export function saveMeal(meal: MealEntry): MealEntry {
  const db = readDB()
  db.meals[meal.id] = meal
  writeDB(db)
  return meal
}

export function getMealsForUser(userId: string, date?: string): MealEntry[] {
  const db = readDB()
  return Object.values(db.meals)
    .filter((m) => m.userId === userId && (!date || m.date === date))
    .sort((a, b) => a.time.localeCompare(b.time))
}

export function deleteMeal(id: string, userId: string): boolean {
  const db = readDB()
  if (!db.meals[id] || db.meals[id].userId !== userId) return false
  delete db.meals[id]
  writeDB(db)
  return true
}
