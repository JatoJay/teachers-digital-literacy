import { useState, useCallback } from 'react'
import { useModel } from './useModel'
import { buildLessonPlanPrompt } from '../lib/prompts/lesson-plan'
import { saveLessonPlan } from '../lib/db'
import type { EducationLevel, Subject, LessonPlan } from '../types'

interface GeneratorInput {
  topic: string
  subject: Subject
  level: EducationLevel
  grade: string
  duration: number
  additionalContext?: string
}

interface GeneratorState {
  isGenerating: boolean
  streamedContent: string
  error: string | null
}

export function useLessonGenerator() {
  const { generate: modelGenerate, isReady } = useModel()
  const [state, setState] = useState<GeneratorState>({
    isGenerating: false,
    streamedContent: '',
    error: null,
  })

  const generate = useCallback(async (input: GeneratorInput): Promise<LessonPlan | null> => {
    if (!isReady) {
      setState({ isGenerating: false, streamedContent: '', error: 'AI model is still loading' })
      return null
    }

    setState({ isGenerating: true, streamedContent: '', error: null })

    try {
      const prompt = buildLessonPlanPrompt(input)

      const content = await modelGenerate(prompt, (token: string) => {
        setState((prev) => ({
          ...prev,
          streamedContent: prev.streamedContent + token,
        }))
      })

      const lessonPlan: LessonPlan = {
        id: crypto.randomUUID(),
        title: input.topic,
        subject: input.subject,
        level: input.level,
        grade: input.grade,
        duration: input.duration,
        objectives: extractSection(content, 'objectives'),
        materials: extractSection(content, 'materials'),
        introduction: extractTextSection(content, 'introduction'),
        mainActivity: extractTextSection(content, 'main activity'),
        conclusion: extractTextSection(content, 'conclusion'),
        assessment: extractTextSection(content, 'assessment'),
        homework: extractTextSection(content, 'homework'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await saveLessonPlan(lessonPlan)

      setState({ isGenerating: false, streamedContent: content, error: null })
      return lessonPlan
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate lesson plan'
      setState({ isGenerating: false, streamedContent: '', error: errorMsg })
      return null
    }
  }, [modelGenerate, isReady])

  const reset = useCallback(() => {
    setState({ isGenerating: false, streamedContent: '', error: null })
  }, [])

  return {
    ...state,
    generate,
    reset,
  }
}

function extractSection(content: string, sectionName: string): string[] {
  const regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n#|\\n\\d\\.|$)`, 'i')
  const match = content.match(regex)
  if (!match) return []

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((line) => line.length > 0)
}

function extractTextSection(content: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}
