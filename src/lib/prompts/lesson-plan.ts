import type { EducationLevel, Subject } from '../../types'

const LEVEL_CONTEXT: Record<EducationLevel, string> = {
  primary:
    'Primary school students (ages 6-11). Use simple language, visual aids, hands-on activities, and short attention spans. Focus on foundational concepts.',
  secondary:
    'Secondary school students (ages 12-17). Can handle abstract concepts, longer activities, group work, and basic research. Include real-world applications.',
  tertiary:
    'University/polytechnic students (18+). Advanced concepts, critical thinking, research integration, professional applications, and self-directed learning.',
}

const SUBJECT_NAMES: Record<Subject, string> = {
  mathematics: 'Mathematics',
  english: 'English Language',
  science: 'Science',
  social_studies: 'Social Studies',
  civic_education: 'Civic Education',
  agriculture: 'Agricultural Science',
  computer_science: 'Computer Science/ICT',
  business_studies: 'Business Studies',
  creative_arts: 'Creative Arts',
  physical_education: 'Physical Education',
  religious_studies: 'Religious Studies',
  local_language: 'Local Language',
  french: 'French',
  arabic: 'Arabic',
  other: 'General Subject',
}

export function buildLessonPlanPrompt(params: {
  topic: string
  subject: Subject
  level: EducationLevel
  grade: string
  duration: number
  additionalContext?: string
}): string {
  const { topic, subject, level, grade, duration, additionalContext } = params

  return `You are an experienced African teacher helping create lesson plans. Create a detailed, practical lesson plan.

CONTEXT:
- Subject: ${SUBJECT_NAMES[subject]}
- Education Level: ${LEVEL_CONTEXT[level]}
- Grade/Year: ${grade}
- Duration: ${duration} minutes
- Topic: ${topic}
${additionalContext ? `- Additional Notes: ${additionalContext}` : ''}

Create a lesson plan with these sections:

1. LEARNING OBJECTIVES (3-5 clear, measurable objectives starting with action verbs)

2. MATERIALS NEEDED (practical items available in African schools - avoid expensive tech)

3. INTRODUCTION (${Math.round(duration * 0.15)} mins)
- Hook to capture attention
- Connect to prior knowledge
- State lesson objectives

4. MAIN ACTIVITY (${Math.round(duration * 0.6)} mins)
- Step-by-step teaching instructions
- Include student activities
- Questions to ask students
- Examples relevant to African context

5. CONCLUSION (${Math.round(duration * 0.15)} mins)
- Summary of key points
- Check for understanding
- Preview next lesson

6. ASSESSMENT
- How to evaluate student understanding
- Sample questions or activities

7. HOMEWORK (optional but recommended)

Format the response clearly with headers. Use simple, clear language. Include culturally relevant examples from African daily life, history, and environment.`
}

export function buildActivityPrompt(params: {
  topic: string
  subject: Subject
  level: EducationLevel
  activityType: 'individual' | 'group' | 'class'
  duration: number
}): string {
  const { topic, subject, level, activityType, duration } = params
  const levelDesc = level === 'primary' ? 'primary school' : level === 'secondary' ? 'secondary school' : 'university'

  return `Create a ${duration}-minute ${activityType} activity about "${topic}" for ${levelDesc} ${SUBJECT_NAMES[subject]} students.

## Activity Title
Write a catchy title here.

## What You Need
List 3-5 simple materials available in African schools.

## Instructions
1. First step
2. Second step
3. Continue with clear numbered steps

## What Students Will Learn
Describe the learning outcomes.

Keep it simple, hands-on, and use African examples.`
}

export function buildAssessmentPrompt(params: {
  topic: string
  subject: Subject
  level: EducationLevel
  assessmentType: 'quiz' | 'test' | 'worksheet'
  questionCount: number
}): string {
  const { topic, subject, level, assessmentType, questionCount } = params
  const levelDesc = level === 'primary' ? 'primary school' : level === 'secondary' ? 'secondary school' : 'university'

  return `Create a ${assessmentType} with ${questionCount} questions about "${topic}" for ${levelDesc} ${SUBJECT_NAMES[subject]} students.

## ${topic} - ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}

**Question 1** (Multiple Choice)
Write a question here.
A) Option A
B) Option B
C) Option C
D) Option D
**Answer: A**

**Question 2** (True/False)
Write a statement here.
**Answer: True**

**Question 3** (Short Answer)
Write a question here.
**Answer: Write the expected answer.**

Continue with ${questionCount - 3} more questions. Use African examples. Mix question types.`
}
