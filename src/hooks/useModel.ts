import { useContext } from 'react'
import { ModelContext } from '../contexts/model-context'

export function useModel() {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModel must be used within ModelProvider')
  }
  return context
}
