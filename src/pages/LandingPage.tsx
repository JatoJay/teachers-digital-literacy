import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Sparkles,
  Globe,
  Smartphone,
  Download,
  ArrowRight,
  WifiOff,
  Shield,
  HeartHandshake,
  ShieldCheck,
  FolderOpen,
  Wifi,
  CheckCircle2,
} from 'lucide-react'
import { detectDevice, type DeviceKind } from '../lib/device'

const ANDROID_APK_URL =
  'https://storage.googleapis.com/karatuai-models/apks/karatuai-android-v1.0.0.apk'
const ANDROID_APK_VERSION = '1.0.0'
const ANDROID_APK_SIZE = '4.8 MB'

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const FADE_UP_SLOW = { ...FADE_UP, transition: { delay: 0.15 } }
const FADE_UP_SLOWER = { ...FADE_UP, transition: { delay: 0.3 } }
const FADE_UP_SLOWEST = { ...FADE_UP, transition: { delay: 0.45 } }

const PANEL_INITIAL = { opacity: 0, height: 0 }
const PANEL_ANIMATE = { opacity: 1, height: 'auto' }
const PANEL_EXIT = { opacity: 0, height: 0 }

const installSteps = [
  {
    icon: FolderOpen,
    title: 'Open the file once it downloads',
    body: 'Tap the notification, or find the APK in your Downloads folder.',
  },
  {
    icon: ShieldCheck,
    title: 'Allow install from this source',
    body: 'Android will ask the first time. Tap "Settings" then enable the toggle. This is normal for any app outside the Play Store.',
  },
  {
    icon: CheckCircle2,
    title: 'If Play Protect warns you, tap "Install anyway"',
    body: 'Google has not seen our app yet, so it shows a caution. We will be on the Play Store soon.',
  },
  {
    icon: Wifi,
    title: 'First launch downloads the AI on WiFi',
    body: 'About 1.9 GB, one time only. After that the app runs offline.',
  },
]

function WebButton() {
  return (
    <Link
      to="/curriculum"
      className="group flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
    >
      <Globe size={20} />
      <span>Use in your browser</span>
      <ArrowRight
        size={18}
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  )
}

function AndroidDownloadCard({ onDownload }: { onDownload: () => void }) {
  return (
    <a
      href={ANDROID_APK_URL}
      onClick={onDownload}
      className="group flex items-center justify-between gap-4 w-full px-5 py-4 rounded-2xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Download size={20} />
        </div>
        <div className="text-left">
          <div>Download for Android</div>
          <div className="text-xs font-normal text-emerald-50">
            v{ANDROID_APK_VERSION} · {ANDROID_APK_SIZE}
          </div>
        </div>
      </div>
      <ArrowRight
        size={18}
        className="transition-transform group-hover:translate-x-1"
      />
    </a>
  )
}

function InstallStepsPanel({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={PANEL_INITIAL}
          animate={PANEL_ANIMATE}
          exit={PANEL_EXIT}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="mt-4 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-4">
              What happens next
            </p>
            <ol className="space-y-4">
              {installSteps.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white text-emerald-600 flex items-center justify-center text-sm font-bold border border-emerald-200">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon size={14} className="text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-800">
                        {title}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DesktopAndroidCard() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
      <div className="shrink-0 p-2 bg-white rounded-xl border border-emerald-100">
        <QRCodeSVG
          value={ANDROID_APK_URL}
          size={88}
          level="M"
          marginSize={0}
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
          <Download size={16} />
          <span className="text-sm">Android app · v{ANDROID_APK_VERSION}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Point your Android phone&apos;s camera at the code to download the
          APK ({ANDROID_APK_SIZE}).
        </p>
      </div>
    </div>
  )
}

function IPhoneNote() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500">
      <Smartphone size={18} className="shrink-0" />
      <span className="text-xs">
        <span className="font-semibold text-slate-600">iPhone app coming soon.</span>{' '}
        On-device AI does not fit in iPhone browsers yet.
      </span>
    </div>
  )
}

const features = [
  {
    icon: WifiOff,
    title: 'Works offline',
    body: 'Once the AI loads, no internet needed. Plan lessons anywhere.',
  },
  {
    icon: Shield,
    title: 'Your data stays private',
    body: 'The AI runs on your device. Nothing you type leaves your phone.',
  },
  {
    icon: HeartHandshake,
    title: 'Free to use',
    body: 'No subscriptions, no API costs. Built for African teachers.',
  },
]

function recommendationFor(device: DeviceKind) {
  if (device === 'ios') {
    return {
      title: 'KaratuAI on iPhone',
      body: 'The on-device AI needs more memory than iPhone browsers allow. We are building a native iPhone app — until then, please use the web version on a laptop or an Android phone.',
    }
  }
  if (device === 'android') {
    return {
      title: 'Get the Android app',
      body: 'You can use KaratuAI in your browser right now, or install the Android app for a smoother experience.',
    }
  }
  return {
    title: 'Ready when you are',
    body: 'KaratuAI runs in your browser — no install, nothing to set up. On Android, the dedicated app is also available.',
  }
}

export default function LandingPage() {
  const device = useMemo(() => detectDevice(), [])
  const [stepsRevealed, setStepsRevealed] = useState(false)
  const recommendation = recommendationFor(device)
  const showWebButton = device !== 'ios'

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-6 py-10 sm:py-16">
        <motion.header
          {...FADE_UP}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">KaratuAI</h1>
            <p className="text-xs text-slate-500">Teacher&apos;s Companion</p>
          </div>
        </motion.header>

        <motion.section {...FADE_UP_SLOW} className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mb-4">
            AI that helps you plan lessons,{' '}
            <span className="text-teal-600">right on your device.</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Generate schemes of work, lesson plans, classroom activities, and
            assessments — all powered by an AI that runs offline on your phone
            or laptop.
          </p>
        </motion.section>

        <motion.section
          {...FADE_UP_SLOWER}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 mb-12"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {recommendation.title}
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {recommendation.body}
          </p>

          {showWebButton && (
            <div className="mb-6">
              <WebButton />
            </div>
          )}

          {device === 'android' && (
            <>
              <AndroidDownloadCard onDownload={() => setStepsRevealed(true)} />
              <InstallStepsPanel visible={stepsRevealed} />
            </>
          )}

          {device === 'desktop' && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Or get the mobile app
              </p>
              <DesktopAndroidCard />
              <IPhoneNote />
            </div>
          )}

          {device === 'ios' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
              <Smartphone size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                Try KaratuAI on a laptop or an Android phone today. We will
                announce the iPhone app the moment it is ready.
              </p>
            </div>
          )}
        </motion.section>

        <motion.section {...FADE_UP_SLOWEST}>
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Why on-device AI?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-100 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <footer className="mt-16 text-center text-xs text-slate-400">
          Built for African teachers. Powered by Gemma running on your device.
        </footer>
      </div>
    </div>
  )
}
