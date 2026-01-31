import { NavLink } from 'react-router-dom'
// import { LayoutDashboard, Users, Mail, FileText, ClipboardList } from 'lucide-react'
import { LayoutDashboard, Users, Mail, FileText } from 'lucide-react'
import { cn } from '../../utils/cn'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Utilisateurs', icon: Users },
  { to: '/contacts', label: 'Contacts', icon: Mail },
  { to: '/quote-requests', label: 'Demandes de devis', icon: FileText },
  // { to: '/lead-forms', label: 'Formulaires', icon: ClipboardList },
]

export function SidebarNav() {
  return (
    <aside className="hidden w-64 flex-col gap-6 border-r border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-6 md:flex">
      <div className="px-2">
        <p className="text-sm font-semibold text-[hsl(var(--primary))]">Report Admin</p>
        <p className="text-xs text-muted-foreground">Gestion interne</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          )
        })}
      </nav>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--accent))] p-3 text-xs text-muted-foreground">
        Connecté via jeton sécurisé
      </div>
    </aside>
  )
}
