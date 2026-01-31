import { useQuery } from '@tanstack/react-query'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { getDashboardStats } from '../api/dashboard'
import { queryKeys } from '../api/queryKeys'

const mockStats = {
  contacts: {
    total: 18,
    byStatus: { new: 7, in_progress: 6, closed: 5 },
  },
  devis: {
    total: 24,
    byStatus: { new: 8, quoted: 6, won: 6, lost: 4 },
  },
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardStats,
  })

  const displayData = data ?? mockStats
  const contactsStats = displayData.contacts.byStatus
  const devisStats = displayData.devis.byStatus

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble des demandes et contacts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs text-muted-foreground">Contacts</p>
          {isLoading && data ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <p className="mt-2 text-3xl font-semibold">{displayData.contacts.total}</p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Demandes de devis</p>
          {isLoading && data ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <p className="mt-2 text-3xl font-semibold">{displayData.devis.total}</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">Statuts contacts</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['new', 'in_progress', 'closed'].map((status) => (
              <div key={status} className="flex items-center gap-2 rounded-[10px] border border-[hsl(var(--border))] px-3 py-2">
                <Badge variant={status === 'closed' ? 'success' : status === 'in_progress' ? 'warning' : 'info'}>{status}</Badge>
                <span className="text-sm font-semibold">{contactsStats[status as keyof typeof contactsStats]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Statuts devis</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['new', 'quoted', 'won', 'lost'].map((status) => (
              <div key={status} className="flex items-center gap-2 rounded-[10px] border border-[hsl(var(--border))] px-3 py-2">
                <Badge
                  variant={
                    status === 'won'
                      ? 'success'
                      : status === 'lost'
                        ? 'danger'
                        : status === 'quoted'
                          ? 'warning'
                          : 'info'
                  }
                >
                  {status}
                </Badge>
                <span className="text-sm font-semibold">{devisStats[status as keyof typeof devisStats]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
