import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from '../lib/db'
import { extractLocalContext } from '../lib/local-context'
import type { LocalContext } from '../types'

export function useLocalContext(): LocalContext | undefined {
  const settings = useLiveQuery(() => getSettings(), [])
  return settings ? extractLocalContext(settings) : undefined
}
