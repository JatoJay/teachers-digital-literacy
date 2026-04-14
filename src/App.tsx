import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ModelProvider from './contexts/ModelContext'
import ModelLoadingScreen from './components/ModelLoadingScreen'
import Layout from './components/layout/Layout'
import LessonPlannerPage from './pages/LessonPlannerPage'
import ActivitiesPage from './pages/ActivitiesPage'
import AssessmentsPage from './pages/AssessmentsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <ModelProvider>
      <ModelLoadingScreen />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LessonPlannerPage />} />
            <Route path="activities" element={<ActivitiesPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ModelProvider>
  )
}
