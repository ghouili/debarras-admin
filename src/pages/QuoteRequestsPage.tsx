import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import type { DevisDto, ListResponse } from "../types/dtos";
import { queryKeys } from "../api/queryKeys";
import {
  createDevis,
  deleteDevis,
  listDevis,
  updateDevis,
  updateDevisStatus,
} from "../api/devis";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Pagination } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import { Skeleton } from "../components/ui/Skeleton";

const schema = z.object({
  source: z.string().min(2, "Source requise"),
  service: z.string().min(2, "Service requis"),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  timing: z.string().optional(),
  localType: z.string().optional(),
  propertyType: z.string().optional(),
  rooms: z.coerce.number().optional(),
  volume: z.coerce.number().optional(),
  volumeEstimate: z.string().optional(),
  floor: z.coerce.number().optional(),
  elevator: z.boolean().optional(),
  truckAccess: z.boolean().optional(),
  surfaceArea: z.coerce.number().optional(),
  message: z.string().optional(),
  fullName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(4, "Téléphone requis"),
  consent: z.boolean(),
  status: z.enum(["nouveau", "traite", "gagne", "perdu"]),
});

type FormValues = z.infer<typeof schema>;

// const mockQuoteRequests: DevisDto[] = []

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const devisStatusOptions = [
  { value: "nouveau", label: "Nouveau" },
  { value: "traite", label: "Traité" },
  { value: "gagne", label: "Gagné" },
  { value: "perdu", label: "Perdu" },
] as const;

const devisStatusLabels: Record<DevisDto["status"], string> = {
  nouveau: "Nouveau",
  traite: "Traité",
  gagne: "Gagné",
  perdu: "Perdu",
};

const devisStatusVariants: Record<
  DevisDto["status"],
  "success" | "warning" | "danger" | "info"
> = {
  nouveau: "info",
  traite: "warning",
  gagne: "success",
  perdu: "danger",
};

const devisStatusBarClasses: Record<
  "success" | "warning" | "danger" | "info",
  string
> = {
  success: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  danger: "bg-[hsl(var(--danger))]",
  info: "bg-[hsl(var(--primary))]",
};

export function QuoteRequestsPage() {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useQuery<ListResponse<DevisDto>>({
    queryKey: queryKeys.devis,
    queryFn: () => listDevis(),
  });
  const data = response?.items;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DevisDto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<DevisDto | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const createMutation = useMutation({
    mutationFn: createDevis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis });
      toast.success("Demande créée");
      setModalOpen(false);
    },
    onError: () => toast.error("Création échouée"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormValues }) =>
      updateDevis(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis });
      toast.success("Demande mise à jour");
      setModalOpen(false);
    },
    onError: () => toast.error("Mise à jour échouée"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDevis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis });
      toast.success("Demande supprimée");
      setConfirmOpen(false);
    },
    onError: () => toast.error("Suppression échouée"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DevisDto["status"] }) =>
      updateDevisStatus(id, status),
    onMutate: async ({ id, status }) => {
      setStatusUpdatingId(id);
      await queryClient.cancelQueries({ queryKey: queryKeys.devis });
      const previous = queryClient.getQueryData<ListResponse<DevisDto>>(
        queryKeys.devis,
      );
      if (previous) {
        queryClient.setQueryData<ListResponse<DevisDto>>(queryKeys.devis, {
          ...previous,
          items: previous.items.map((item) =>
            item.id === id ? { ...item, status } : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.devis, context.previous);
      }
      toast.error("Mise à jour du statut échouée");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devis });
      toast.success("Statut mis à jour");
    },
    onSettled: () => {
      setStatusUpdatingId(null);
    },
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    return items.filter((item: DevisDto) => {
      const matchesSearch = [
        item.fullName,
        item.email,
        item.phone,
        item.city,
        item.service,
      ]
        .join(" ")
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesStatus = status === "ALL" ? true : item.status === status;
      const matchesService =
        serviceFilter === "ALL" ? true : item.service === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [data, debouncedSearch, status, serviceFilter]);

  const serviceOptions = useMemo(() => {
    const items = data ?? [];
    return Array.from(
      new Set(items.map((item: DevisDto) => item.service)),
    ).filter(Boolean) as string[];
  }, [data]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // const openCreate = () => {
  //   setEditing(null)
  //   setModalOpen(true)
  // }

  const openEdit = (quote: DevisDto) => {
    setEditing(quote);
    setModalOpen(true);
  };

  const openDelete = (quote: DevisDto) => {
    setSelectedQuote(quote);
    setConfirmOpen(true);
  };

  const handleStatusChange = (
    quote: DevisDto,
    nextStatus: DevisDto["status"],
  ) => {
    if (quote.status === nextStatus) return;
    statusMutation.mutate({ id: quote.id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Demandes de devis</h1>
          <p className="text-sm text-muted-foreground">
            Suivi complet des demandes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-[10px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1">
            <Button
              size="sm"
              variant={viewMode === "table" ? "primary" : "ghost"}
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
            >
              Tableau
            </Button>
            <Button
              size="sm"
              variant={viewMode === "cards" ? "primary" : "ghost"}
              onClick={() => setViewMode("cards")}
              aria-pressed={viewMode === "cards"}
            >
              Cartes
            </Button>
          </div>
          {/* <Button onClick={openCreate}>Nouvelle demande</Button> */}
        </div>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Rechercher par nom, email, téléphone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="col-span-2 lg:col-span-3"
          />
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            {devisStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={serviceFilter}
            onChange={(event) => setServiceFilter(event.target.value)}
          >
            <option value="ALL">Tous les services</option>
            {serviceOptions.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        {isLoading && (data?.length ?? 0) > 0 ? (
          <Skeleton className="h-40 w-full" />
        ) : viewMode === "table" ? (
          <>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nom</TableHeaderCell>
                  <TableHeaderCell>Service</TableHeaderCell>
                  <TableHeaderCell>Ville</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {pageItems.map((quote: DevisDto) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-semibold">
                      {quote.fullName}
                    </TableCell>
                    <TableCell>{quote.service}</TableCell>
                    <TableCell>{quote.city}</TableCell>
                    <TableCell>
                      <Select
                        value={quote.status}
                        onChange={(event) =>
                          handleStatusChange(
                            quote,
                            event.target.value as DevisDto["status"],
                          )
                        }
                        disabled={statusUpdatingId === quote.id}
                        className="w-20 px-2 py-1.5 pr-6 text-xs"
                      >
                        {devisStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(quote)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDelete(quote)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
            {pageItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune demande trouvée.
              </p>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {pageItems.map((quote: DevisDto) => (
                <Card
                  key={quote.id}
                  className="group relative overflow-hidden border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${
                      devisStatusBarClasses[devisStatusVariants[quote.status]]
                    }`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-sm font-semibold text-[hsl(var(--primary))]">
                        {getInitials(quote.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          {quote.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quote.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quote.phone}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={devisStatusVariants[quote.status]}
                    >
                      {devisStatusLabels[quote.status] ?? quote.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        Service
                      </p>
                      <p>{quote.service}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        Ville
                      </p>
                      <p>
                        {quote.city} • {quote.postalCode}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        Message
                      </p>
                      <p>{quote.message ?? "Non renseigné"}</p>
                    </div>
                    {/* <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">Volume estimé</p>
                      <p>{quote.volumeEstimate ?? 'Non renseigné'}</p>
                    </div> */}
                  </div>
                  <div className="flex flex-row justify-between items-center">
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(quote)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDelete(quote)}
                      >
                        Supprimer
                      </Button>
                    </div>
                    <div className="">
                      <Select
                        value={quote.status}
                        onChange={(event) =>
                          handleStatusChange(
                            quote,
                            event.target.value as DevisDto["status"],
                          )
                        }
                        disabled={statusUpdatingId === quote.id}
                        className="w-20 p-0 text-xs"
                      >
                        {devisStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {pageItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune demande trouvée.
              </p>
            )}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <QuoteModal
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
        title="Supprimer la demande"
        description={`Voulez-vous supprimer la demande de ${selectedQuote?.fullName ?? "ce prospect"} ?`}
        onConfirm={() =>
          selectedQuote && deleteMutation.mutate(selectedQuote.id)
        }
      />
    </div>
  );
}

function QuoteModal({
  open,
  onClose,
  editing,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: DevisDto | null;
  onSubmit: (values: FormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      source: "",
      service: "",
      postalCode: "",
      city: "",
      timing: "",
      localType: "",
      propertyType: "",
      rooms: undefined,
      volume: undefined,
      volumeEstimate: "",
      floor: undefined,
      elevator: false,
      truckAccess: false,
      surfaceArea: undefined,
      message: "",
      fullName: "",
      email: "",
      phone: "",
      consent: true,
      status: "nouveau",
    },
  });

  useEffect(() => {
    if (editing) {
      reset({
        source: editing.source,
        service: editing.service,
        postalCode: editing.postalCode || "",
        city: editing.city || "",
        timing: editing.timing || "",
        localType: editing.localType || "",
        propertyType: editing.propertyType || "",
        rooms: editing.rooms,
        volume: editing.volume,
        volumeEstimate: editing.volumeEstimate || "",
        floor: editing.floor,
        elevator: editing.elevator ?? false,
        truckAccess: editing.truckAccess ?? false,
        surfaceArea: editing.surfaceArea,
        message: editing.message || "",
        fullName: editing.fullName,
        email: editing.email,
        phone: editing.phone,
        consent: editing.consent,
        status: editing.status,
      });
    } else {
      reset({
        source: "",
        service: "",
        postalCode: "",
        city: "",
        timing: "",
        localType: "",
        propertyType: "",
        rooms: undefined,
        volume: undefined,
        volumeEstimate: "",
        floor: undefined,
        elevator: false,
        truckAccess: false,
        surfaceArea: undefined,
        message: "",
        fullName: "",
        email: "",
        phone: "",
        consent: true,
        status: "nouveau",
      });
    }
  }, [editing, reset]);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={editing ? "Modifier la demande" : "Créer une demande"}
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold">Source</label>
          <Input {...register("source")} />
          {errors.source && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.source.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Service</label>
          <Input {...register("service")} />
          {errors.service && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.service.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Nom complet</label>
          <Input {...register("fullName")} />
          {errors.fullName && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.fullName.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Email</label>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Téléphone</label>
          <Input {...register("phone")} />
          {errors.phone && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Code postal</label>
          <Input {...register("postalCode")} />
          {errors.postalCode && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.postalCode.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Ville</label>
          <Input {...register("city")} />
          {errors.city && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.city.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Timing</label>
          <Input {...register("timing")} />
          {errors.timing && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.timing.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Type de local</label>
          <Input {...register("localType")} />
          {errors.localType && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.localType.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Type de bien</label>
          <Input {...register("propertyType")} />
          {errors.propertyType && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.propertyType.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Pièces</label>
          <Input type="number" {...register("rooms")} />
          {errors.rooms && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.rooms.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Volume (m³)</label>
          <Input type="number" {...register("volume")} />
          {errors.volume && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.volume.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Volume estimé</label>
          <Input {...register("volumeEstimate")} />
          {errors.volumeEstimate && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.volumeEstimate.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Étage</label>
          <Input type="number" {...register("floor")} />
          {errors.floor && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.floor.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Surface (m²)</label>
          <Input type="number" {...register("surfaceArea")} />
          {errors.surfaceArea && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.surfaceArea.message}
            </p>
          )}
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold">Message</label>
          <Input {...register("message")} />
          {errors.message && (
            <p className="text-xs text-[hsl(var(--danger))]">
              {errors.message.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" {...register("elevator")} id="elevator" />
          <label htmlFor="elevator" className="text-xs">
            Ascenseur
          </label>
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            {...register("truckAccess")}
            id="truckAccess"
          />
          <label htmlFor="truckAccess" className="text-xs">
            Accès camion
          </label>
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" {...register("consent")} id="consentDevis" />
          <label htmlFor="consentDevis" className="text-xs">
            Consentement
          </label>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold">Statut</label>
          <Select {...register("status")}>
            {devisStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({
  open,
  onClose,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
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
  );
}
