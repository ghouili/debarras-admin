import { Outlet } from 'react-router-dom'
import { SidebarNav } from './SidebarNav'
import { Topbar } from './Topbar'

export function AdminShell() {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--muted))]">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6 md:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
