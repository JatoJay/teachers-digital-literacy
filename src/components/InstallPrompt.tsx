import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Share, X } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

// Wait a few seconds after the prompt becomes available so the banner doesn't
// pop up the instant the page loads.
const REVEAL_DELAY_MS = 3000

const BANNER_INITIAL = { y: 120, opacity: 0 }
const BANNER_ANIMATE = { y: 0, opacity: 1 }
const BANNER_EXIT = { y: 120, opacity: 0 }
const BANNER_TRANSITION = { type: 'spring' as const, stiffness: 350, damping: 30 }

function InstallPrompt() {
  const { canInstall, isIOS, hasNativePrompt, promptInstall, dismiss } = useInstallPrompt()
  const [delayElapsed, setDelayElapsed] = useState(false)

  useEffect(() => {
    if (!canInstall) return
    const id = window.setTimeout(() => setDelayElapsed(true), REVEAL_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [canInstall])

  const visible = canInstall && delayElapsed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={BANNER_INITIAL}
          animate={BANNER_ANIMATE}
          exit={BANNER_EXIT}
          transition={BANNER_TRANSITION}
          className="fixed left-3 right-3 z-40 max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-4"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
          role="dialog"
          aria-label="Install KaratuAI"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0">
              <Download size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Install KaratuAI</p>
              {isIOS && !hasNativePrompt ? (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tap <Share size={12} className="inline align-text-bottom mx-0.5" /> Share,
                  then <span className="font-medium">Add to Home Screen</span>.
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  One-tap access and full offline use.
                </p>
              )}
              {hasNativePrompt && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 rounded-xl transition-colors"
                >
                  Install
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(InstallPrompt)
