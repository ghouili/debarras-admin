import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { createUser, deleteUser, listUsers, updateUser } from '../api/users'
import { queryKeys } from '../api/queryKeys'
import type { UserDto } from '../types/dtos'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Pagination } from '../components/ui/Pagination'
import { Skeleton } from '../components/ui/Skeleton'

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mot de passe requis').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'AGENT']),
  isActive: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

const mockUsers: UserDto[] = [
  {
    id: 'usr_001',
    firstName: 'Camille',
    lastName: 'Martin',
    email: 'camille.martin@debarras-aurea.fr',
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2025-12-12T08:15:00.000Z',
    updatedAt: '2026-01-12T10:30:00.000Z',
  },
  {
    id: 'usr_002',
    firstName: 'Nadia',
    lastName: 'Ben Ali',
    email: 'nadia.benali@debarras-aurea.fr',
    role: 'MANAGER',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2025-10-08T09:20:00.000Z',
    updatedAt: '2026-01-15T14:05:00.000Z',
  },
  {
    id: 'usr_003',
    firstName: 'Julien',
    lastName: 'Petit',
    email: 'julien.petit@debarras-aurea.fr',
    role: 'AGENT',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2025-11-02T12:40:00.000Z',
    updatedAt: '2026-01-09T08:50:00.000Z',
  },
  {
    id: 'usr_004',
    firstName: 'Sophie',
    lastName: 'Laurent',
    email: 'sophie.laurent@debarras-aurea.fr',
    role: 'AGENT',
    isActive: false,
    isEmailVerified: false,
    createdAt: '2025-09-18T15:00:00.000Z',
    updatedAt: '2026-01-03T11:10:00.000Z',
  },
  {
    id: 'usr_005',
    firstName: 'Rayan',
    lastName: 'Haddad',
    email: 'rayan.haddad@debarras-aurea.fr',
    role: 'MANAGER',
    isActive: true,
    isEmailVerified: true,
    createdAt: '2025-08-22T10:05:00.000Z',
    updatedAt: '2026-01-20T17:25:00.000Z',
  },
]

const getInitials = (firstName: string, lastName: string) =>
  `${firstName[0]?.toUpperCase() || ''}${lastName[0]?.toUpperCase() || ''}`

export function UsersPage() {
  const queryClient = useQueryClient()
  const { data: response, isLoading } = useQuery({ queryKey: queryKeys.users, queryFn: listUsers })
  const data = response?.items
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [sort, setSort] = useState<{ key: keyof UserDto; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null)

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('Utilisateur créé')
      setModalOpen(false)
    },
    onError: () => toast.error('Création échouée'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormValues }) => {
      const { password, ...rest } = payload
      void password
      return updateUser(id, rest)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('Utilisateur mis à jour')
      setModalOpen(false)
    },
    onError: () => toast.error('Mise à jour échouée'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success('Utilisateur désactivé')
      setConfirmOpen(false)
    },
    onError: () => toast.error('Action échouée'),
  })

  const sortedData = useMemo(() => {
    const items = [...(data && data.length > 0 ? data : mockUsers)]
    items.sort((a, b) => {
      const valueA = a[sort.key]
      const valueB = b[sort.key]
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sort.direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }
      return 0
    })
    return items
  }, [data, sort])

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const pageItems = sortedData.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (user: UserDto) => {
    setEditing(user)
    setModalOpen(true)
  }

  const openDeactivate = (user: UserDto) => {
    setSelectedUser(user)
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Gérez les accès et les rôles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-[10px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1">
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
            >
              Tableau
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'cards' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
            >
              Cartes
            </Button>
          </div>
          <Button onClick={openCreate}>Nouvel utilisateur</Button>
        </div>
      </div>

      <Card className="space-y-4">
        {isLoading && (data?.length ?? 0) > 0 ? (
          <Skeleton className="h-40 w-full" />
        ) : viewMode === 'table' ? (
          <>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell onClick={() => setSort({ key: 'lastName', direction: sort.direction === 'asc' ? 'desc' : 'asc' })}>Nom</TableHeaderCell>
                  <TableHeaderCell onClick={() => setSort({ key: 'email', direction: sort.direction === 'asc' ? 'desc' : 'asc' })}>Email</TableHeaderCell>
                  <TableHeaderCell>Rôle</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {pageItems.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="info">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Actif' : 'Inactif'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(user)}>
                          Modifier
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeactivate(user)}>
                          Désactiver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
            {pageItems.length === 0 && <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {pageItems.map((user) => (
                <Card
                  key={user.id}
                  className="group relative overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--primary))]/70" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold text-[hsl(var(--primary))]">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{user.role}</Badge>
                    <span className="text-xs text-muted-foreground">Créé : {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(user)}>
                      Modifier
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeactivate(user)}>
                      Désactiver
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {pageItems.length === 0 && <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSubmit={(values) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, payload: values })
            return
          }
          if (!values.password) {
            toast.error('Mot de passe requis')
            return
          }
          createMutation.mutate({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            role: values.role,
            password: values.password,
          })
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Désactiver l'utilisateur"
        description={`Voulez-vous désactiver ${selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'cet utilisateur'} ?`}
        onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
      />
    </div>
  )
}

function UserModal({
  open,
  onClose,
  editing,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  editing: UserDto | null
  onSubmit: (values: FormValues) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'AGENT',
      isActive: true,
    },
  })

  useEffect(() => {
    if (editing) {
      reset({
        firstName: editing.firstName,
        lastName: editing.lastName,
        email: editing.email,
        phone: editing.phone || '',
        password: '',
        role: editing.role,
        isActive: editing.isActive,
      })
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'AGENT',
        isActive: true,
      })
    }
  }, [editing, reset])

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={editing ? 'Modifier utilisateur' : 'Créer utilisateur'}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Prénom</label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-[hsl(var(--danger))]">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Nom</label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-[hsl(var(--danger))]">{errors.lastName.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Email</label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-[hsl(var(--danger))]">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Téléphone</label>
          <Input {...register('phone')} />
          {errors.phone && <p className="text-xs text-[hsl(var(--danger))]">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Mot de passe</label>
          <Input type="password" {...register('password')} required={!editing} />
          {errors.password && <p className="text-xs text-[hsl(var(--danger))]">{errors.password.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Rôle</label>
          <Select {...register('role')}>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="AGENT">AGENT</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({
  open,
  onClose,
  title,
  description,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  onConfirm: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={onConfirm}>Confirmer</Button>
      </div>
    </Modal>
  )
}
