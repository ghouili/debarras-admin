import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import type { ContactDto, ListResponse } from '../types/dtos'
import { queryKeys } from '../api/queryKeys'
import { createContact, deleteContact, listContacts, updateContact } from '../api/contacts'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'

const schema = z.object({
  source: z.string().min(2, 'Source requise'),
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(4, 'Téléphone requis'),
  postalCode: z.string().optional(),
  message: z.string().min(2, 'Message requis'),
  consent: z.boolean(),
  status: z.enum(['new', 'in_progress', 'closed']),
})

type FormValues = z.infer<typeof schema>

// const mockContacts: ContactDto[] = []

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

export function ContactsPage() {
  const queryClient = useQueryClient()
  const { data: response, isLoading } = useQuery<ListResponse<ContactDto>>({
    queryKey: queryKeys.contacts,
    queryFn: () => listContacts(),
  })
  const data = response?.items
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContactDto | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handle)
  }, [search])

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
      toast.success('Contact créé')
      setModalOpen(false)
    },
    onError: () => toast.error('Création échouée'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormValues }) => updateContact(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
      toast.success('Contact mis à jour')
      setModalOpen(false)
    },
    onError: () => toast.error('Mise à jour échouée'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts })
      toast.success('Contact supprimé')
      setConfirmOpen(false)
    },
    onError: () => toast.error('Suppression échouée'),
  })

  const filtered = useMemo(() => {
    const items = data ?? []
    return items.filter((contact: ContactDto) => {
      const matchesSearch = [contact.name, contact.email, contact.phone]
        .join(' ')
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase())
      const matchesStatus = status === 'ALL' ? true : contact.status === status
      return matchesSearch && matchesStatus
    })
  }, [data, debouncedSearch, status])

  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (contact: ContactDto) => {
    setEditing(contact)
    setModalOpen(true)
  }

  const openDelete = (contact: ContactDto) => {
    setSelectedContact(contact)
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">Suivi des demandes entrantes.</p>
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
          <Button onClick={openCreate}>Nouveau contact</Button>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Rechercher par nom, email ou téléphone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Fermé</option>
          </Select>
        </div>

        {isLoading && (data?.length ?? 0) > 0 ? (
          <Skeleton className="h-40 w-full" />
        ) : viewMode === 'table' ? (
          <>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nom</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Téléphone</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {pageItems.map((contact: ContactDto) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-semibold">{contact.name}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>
                      <Badge variant={contact.status === 'closed' ? 'success' : contact.status === 'in_progress' ? 'warning' : 'info'}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(contact)}>
                          Modifier
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openDelete(contact)}>
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
            {pageItems.length === 0 && <p className="text-sm text-muted-foreground">Aucun contact trouvé.</p>}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {pageItems.map((contact: ContactDto) => (
                <Card
                  key={contact.id}
                  className="group relative overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--primary))]/70" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold text-[hsl(var(--primary))]">
                        {getInitials(contact.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                    </div>
                    <Badge variant={contact.status === 'closed' ? 'success' : contact.status === 'in_progress' ? 'warning' : 'info'}>
                      {contact.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">Source</p>
                      <p>{contact.source}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">Message</p>
                      <p>{contact.message}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(contact)}>
                      Modifier
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openDelete(contact)}>
                      Supprimer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            {pageItems.length === 0 && <p className="text-sm text-muted-foreground">Aucun contact trouvé.</p>}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ContactModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSubmit={(values) =>
          editing
            ? updateMutation.mutate({ id: editing.id, payload: values })
            : createMutation.mutate(values)
        }
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Supprimer le contact"
        description={`Voulez-vous supprimer ${selectedContact?.name ?? 'ce contact'} ?`}
        onConfirm={() => selectedContact && deleteMutation.mutate(selectedContact.id)}
      />
    </div>
  )
}

function ContactModal({
  open,
  onClose,
  editing,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  editing: ContactDto | null
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
      source: '',
      name: '',
      email: '',
      phone: '',
      postalCode: '',
      message: '',
      consent: true,
      status: 'new',
    },
  })

  useEffect(() => {
    if (editing) {
      reset({
        source: editing.source,
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        postalCode: editing.postalCode || '',
        message: editing.message,
        consent: editing.consent,
        status: editing.status,
      })
    } else {
      reset({
        source: '',
        name: '',
        email: '',
        phone: '',
        postalCode: '',
        message: '',
        consent: true,
        status: 'new',
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
      title={editing ? 'Modifier contact' : 'Créer contact'}
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Source</label>
          <Input {...register('source')} />
          {errors.source && <p className="text-xs text-[hsl(var(--danger))]">{errors.source.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Nom</label>
          <Input {...register('name')} />
          {errors.name && <p className="text-xs text-[hsl(var(--danger))]">{errors.name.message}</p>}
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
          <label className="text-xs font-semibold">Code postal</label>
          <Input {...register('postalCode')} />
          {errors.postalCode && <p className="text-xs text-[hsl(var(--danger))]">{errors.postalCode.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Statut</label>
          <Select {...register('status')}>
            <option value="new">Nouveau</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Fermé</option>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold">Message</label>
          <Input {...register('message')} />
          {errors.message && <p className="text-xs text-[hsl(var(--danger))]">{errors.message.message}</p>}
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" {...register('consent')} id="consent" />
          <label htmlFor="consent" className="text-xs">Consentement</label>
        </div>
        <div className="flex items-center justify-end gap-2 md:col-span-2">
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
