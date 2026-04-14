import Dexie, { type EntityTable } from 'dexie'
import type { LessonPlan, Activity, Assessment, AppSettings } from '../../types'

const db = new Dexie('TeachersDigitalLiteracy') as Dexie & {
  lessonPlans: EntityTable<LessonPlan, 'id'>
  activities: EntityTable<Activity, 'id'>
  assessments: EntityTable<Assessment, 'id'>
  settings: EntityTable<AppSettings & { id: string }, 'id'>
}

db.version(1).stores({
  lessonPlans: 'id, subject, level, createdAt',
  activities: 'id, subject, level, createdAt',
  assessments: 'id, subject, level, createdAt',
  settings: 'id',
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
