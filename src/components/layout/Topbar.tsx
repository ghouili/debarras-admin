import { LogOut, Search } from 'lucide-react'
import { useAuth } from '../../app/providers/authContext'
import { Button } from '../ui/Button'

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-6 py-4 md:px-10">
      <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Rechercher..."
        />
      </div>
      <div className="hidden items-center gap-4 md:flex">
        <div className="text-right">
          <p className="text-sm font-semibold">
            {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
