import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'karatuai:install-dismissed-at'
// Re-show the banner two weeks after a dismissal — long enough not to nag,
// short enough that a teacher who skipped it during onboarding sees it again.
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari uses the legacy navigator.standalone flag.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  // Chrome/Firefox/Edge on iOS can't trigger A2HS either, so exclude them too —
  // their share sheet doesn't expose Add to Home Screen.
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS/.test(ua)
  return isIOS && !isOtherBrowser
}

function readDismissedAt(): number {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return 0
    const ts = Number(raw)
    return Number.isFinite(ts) ? ts : 0
  } catch {
    return 0
  }
}

export interface InstallPromptState {
  canInstall: boolean
  isInstalled: boolean
  isIOS: boolean
  hasNativePrompt: boolean
  promptInstall: () => Promise<void>
  dismiss: () => void
}

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(isStandalone)
  const [dismissedAt, setDismissedAt] = useState<number>(readDismissedAt)

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
      } else {
        setDismissedAt(Date.now())
        try {
          localStorage.setItem(DISMISSED_KEY, String(Date.now()))
        } catch {
          // localStorage can throw in private mode — banner just re-appears next session.
        }
      }
    } finally {
      setDeferred(null)
    }
  }, [deferred])

  const dismiss = useCallback(() => {
    const now = Date.now()
    setDismissedAt(now)
    try {
      localStorage.setItem(DISMISSED_KEY, String(now))
    } catch {
      // see above
    }
  }, [])

  const isIOS = isIOSSafari()
  const recentlyDismissed = dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS
  const hasNativePrompt = deferred !== null
  const canInstall = !installed && !recentlyDismissed && (hasNativePrompt || isIOS)

  return { canInstall, isInstalled: installed, isIOS, hasNativePrompt, promptInstall, dismiss }
}
