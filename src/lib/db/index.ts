import Dexie, { type EntityTable } from 'dexie'
import type { LessonPlan, Activity, Assessment, AppSettings, SchemeOfWork } from '../../types'

const db = new Dexie('TeachersDigitalLiteracy') as Dexie & {
  lessonPlans: EntityTable<LessonPlan, 'id'>
  activities: EntityTable<Activity, 'id'>
  assessments: EntityTable<Assessment, 'id'>
  schemes: EntityTable<SchemeOfWork, 'id'>
  settings: EntityTable<AppSettings & { id: string }, 'id'>
}

db.version(1).stores({
  lessonPlans: 'id, subject, level, createdAt',
  activities: 'id, subject, level, createdAt',
  assessments: 'id, subject, level, createdAt',
  settings: 'id',
})

db.version(2).stores({
  schemes: 'id, subject, level, term, createdAt',
})

export { db }

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app')
  return (
    settings ?? {
      language: 'en',
      theme: 'system',
      educationLevel: 'primary',
      modelDownloaded: false,
      modelDownloadProgress: 0,
    }
  )
}

export async function saveSettings(settings: Partial<AppSettings>) {
  const current = await getSettings()
  await db.settings.put({ ...current, ...settings, id: 'app' })
}

export async function saveLessonPlan(plan: LessonPlan) {
  await db.lessonPlans.put(plan)
}

export async function getLessonPlans() {
  return db.lessonPlans.orderBy('createdAt').reverse().toArray()
}

export async function deleteLessonPlan(id: string) {
  await db.lessonPlans.delete(id)
}

export async function saveActivity(activity: Activity) {
  await db.activities.put(activity)
}

export async function getActivities() {
  return db.activities.orderBy('createdAt').reverse().toArray()
}

export async function saveAssessment(assessment: Assessment) {
  await db.assessments.put(assessment)
}

export async function getAssessments() {
  return db.assessments.orderBy('createdAt').reverse().toArray()
}

export async function saveScheme(scheme: SchemeOfWork) {
  await db.schemes.put(scheme)
}

export async function getSchemes() {
  return db.schemes.orderBy('createdAt').reverse().toArray()
}

export async function getScheme(id: string) {
  return db.schemes.get(id)
}

export async function deleteScheme(id: string) {
  await db.schemes.delete(id)
}
