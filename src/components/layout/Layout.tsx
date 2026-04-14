import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 grid-bg flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 pb-28 max-w-3xl mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
