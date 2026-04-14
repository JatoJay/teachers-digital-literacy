import { motion } from 'framer-motion'
import { Cpu, RefreshCw, Wifi } from 'lucide-react'
import { useModel } from '../hooks/useModel'
import { Button } from './ui'

export default function ModelLoadingScreen() {
  const { status, progress, error, retry } = useModel()

  if (status === 'ready') return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <motion.div
          animate={{ rotate: status === 'downloading' ? 360 : 0 }}
          transition={{ duration: 2, repeat: status === 'downloading' ? Infinity : 0, ease: 'linear' }}
          className="w-20 h-20 rounded-3xl bg-teal-100 flex items-center justify-center mx-auto mb-6"
        >
          <Cpu size={40} className="text-teal-600" />
        </motion.div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {status === 'error' ? 'Connection Issue' : 'Loading AI Model'}
        </h1>

        {status === 'downloading' && (
          <>
            <p className="text-slate-500 mb-6">
              Downloading AI model for offline use. This only happens once.
            </p>
            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
              <motion.div
                className="bg-teal-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress, 5)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Wifi size={14} />
              <span>~1.9GB download</span>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-slate-500 mb-4">
              {error || 'Failed to load the AI model. Please check your internet connection.'}
            </p>
            <Button onClick={retry} icon={<RefreshCw size={18} />}>
              Try Again
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}
