import type { EducationLevel, Subject } from '../types'

export const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English Language' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'agriculture', label: 'Agricultural Science' },
  { value: 'computer_science', label: 'Computer Science / ICT' },
  { value: 'business_studies', label: 'Business Studies' },
  { value: 'creative_arts', label: 'Creative Arts' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'religious_studies', label: 'Religious Studies' },
  { value: 'local_language', label: 'Local Language' },
  { value: 'french', label: 'French' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'other', label: 'Other Subject' },
]

export const LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'tertiary', label: 'University/Polytechnic' },
]
