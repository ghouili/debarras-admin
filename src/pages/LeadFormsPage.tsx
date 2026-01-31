import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'

const frPhoneRegex = /^(0[1-9]\d{8}|\+33[1-9]\d{8})$/
const ileDeFrancePostalRegex = /^(75|77|78|91|92|93|94|95)\d{3}$/

const normalizePhone = (value: string) => value.replace(/\s+/g, '')

const contactSchema = z.object({
  name: z.string().min(2, 'Veuillez entrer votre nom'),
  phone: z
    .string()
    .min(1, 'Numéro de téléphone invalide')
    .refine((value) => frPhoneRegex.test(normalizePhone(value)), 'Numéro de téléphone invalide'),
  postalCode: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (value) => value === undefined || value === '' || ileDeFrancePostalRegex.test(value),
      'Code postal Île-de-France requis (ex: 75001)',
    ),
  requestType: z.string().optional(),
  message: z.string().optional(),
  consent: z.boolean().refine((value) => value, 'Veuillez accepter le traitement de vos données'),
})

type ContactValues = z.infer<typeof contactSchema>

const quoteSchema = z.object({
  service: z.string().min(1, 'Service requis'),
  postalCode: z.string().min(5, 'Code postal requis'),
  city: z.string().optional(),
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z
    .string()
    .min(1, 'Téléphone requis')
    .refine((value) => frPhoneRegex.test(normalizePhone(value)), 'Numéro de téléphone invalide'),
  consent: z.boolean().refine((value) => value, 'Veuillez accepter le traitement de vos données'),
})

type QuoteValues = z.infer<typeof quoteSchema>

const contactNextSteps = [
  'Nous analysons votre demande',
  'Un conseiller vous rappelle sous 2h',
  'Vous recevez votre devis gratuit',
]

const serviceOptions = [
  { value: 'debarras-maison', label: 'Débarras maison' },
  { value: 'debarras-appartement', label: 'Débarras appartement' },
  { value: 'cave-grenier', label: 'Cave & grenier' },
  { value: 'encombrants', label: 'Encombrants' },
  { value: 'commerces-entrepots', label: 'Commerces & entrepôts' },
  { value: 'bureaux-locaux', label: 'Bureaux & locaux' },
  { value: 'gravats', label: 'Gravats' },
  { value: 'demenagement-particulier', label: 'Déménagement particulier' },
  { value: 'demenagement-entreprise', label: 'Déménagement entreprise' },
]

async function submitLead(payload: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return
  }
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la soumission')
  }
}

export function LeadFormsPage() {
  const [contactSuccess, setContactSuccess] = useState(false)
  const [quoteSuccess, setQuoteSuccess] = useState(false)

  const contactForm = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: 'Camille Martin',
      phone: '06 12 34 56 78',
      postalCode: '75011',
      requestType: 'devis',
      message: 'Bonjour, je souhaite un débarras rapide pour un appartement de 60m².',
      consent: true,
    },
  })

  const quoteForm = useForm<QuoteValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      service: 'debarras-appartement',
      postalCode: '75005',
      city: 'Paris',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@exemple.com',
      phone: '06 45 67 89 10',
      consent: true,
    },
  })

  const contactErrors = contactForm.formState.errors
  const quoteErrors = quoteForm.formState.errors

  const quoteReassurance = useMemo(
    () => 'Réponse sous 2h • Devis gratuit, sans engagement',
    [],
  )

  const handleContactSubmit = async (values: ContactValues) => {
    try {
      await submitLead({
        source: 'contact_form',
        name: values.name,
        phone: normalizePhone(values.phone),
        postalCode: values.postalCode || undefined,
        requestType: values.requestType || 'devis',
        message: values.message || '',
        consent: values.consent,
      })
      setContactSuccess(true)
      contactForm.reset({
        name: '',
        phone: '',
        postalCode: '',
        requestType: 'devis',
        message: '',
        consent: false,
      })
    } catch {
      toast.error('Impossible d\'envoyer votre message pour le moment.')
    }
  }

  const handleQuoteSubmit = async (values: QuoteValues) => {
    try {
      await submitLead({
        service: values.service,
        postalCode: values.postalCode,
        city: values.city || '',
        timing: '',
        localType: '',
        propertyType: '',
        rooms: '',
        volume: '',
        volumeEstimate: '',
        floor: '',
        elevator: false,
        photos: [],
        message: '',
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: normalizePhone(values.phone),
        consent: values.consent,
      })
      setQuoteSuccess(true)
      quoteForm.reset({
        service: '',
        postalCode: '',
        city: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        consent: false,
      })
    } catch {
      toast.error('Impossible d\'envoyer votre demande pour le moment.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Formulaires Débarras Aurea</h1>
        <p className="text-sm text-muted-foreground">
          Centralisez vos demandes de contact et de devis pour vos équipes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Contact</h2>
            <p className="text-sm text-muted-foreground">
              Une prise de contact rapide avec suivi sous 2 heures.
            </p>
          </div>

          {contactSuccess ? (
            <div className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--accent))] p-4">
              <div>
                <h3 className="text-lg font-semibold">Message envoyé !</h3>
                <p className="text-sm text-muted-foreground">
                  Nous avons bien reçu votre message et vous répondrons sous 2 heures maximum.
                </p>
              </div>
              <ul className="space-y-2 text-sm text-[hsl(var(--foreground))]">
                {contactNextSteps.map((step) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                    {step}
                  </li>
                ))}
              </ul>
              <Button variant="secondary" onClick={() => setContactSuccess(false)}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={contactForm.handleSubmit(handleContactSubmit)}>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nom complet</label>
                <Input placeholder="Jean Dupont" {...contactForm.register('name')} />
                {contactErrors.name && (
                  <p className="text-xs text-[hsl(var(--danger))]">{contactErrors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Téléphone</label>
                <Input type="tel" placeholder="06 12 34 56 78" {...contactForm.register('phone')} />
                {contactErrors.phone && (
                  <p className="text-xs text-[hsl(var(--danger))]">{contactErrors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Code postal</label>
                <Input placeholder="75001" {...contactForm.register('postalCode')} />
                {contactErrors.postalCode && (
                  <p className="text-xs text-[hsl(var(--danger))]">{contactErrors.postalCode.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Type de demande</label>
                <Select {...contactForm.register('requestType')}>
                  <option value="devis">Demande de devis</option>
                  <option value="information">Demande d'information</option>
                  <option value="rendez-vous">Prise de rendez-vous</option>
                  <option value="autre">Autre demande</option>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Message</label>
                <Textarea
                  placeholder="Décrivez votre besoin..."
                  rows={4}
                  {...contactForm.register('message')}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-3 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    {...contactForm.register('consent')}
                  />
                  <span>
                    J&apos;accepte d&apos;être contacté(e) par Débarras Aurea pour ma demande.{' '}
                    <a
                      className="font-semibold text-[hsl(var(--primary))] underline"
                      href="/politique-confidentialite"
                    >
                      Politique de confidentialité
                    </a>
                  </span>
                </label>
                {contactErrors.consent && (
                  <p className="text-xs text-[hsl(var(--danger))]">{contactErrors.consent.message}</p>
                )}
              </div>
              <Button type="submit" disabled={contactForm.formState.isSubmitting} className="w-full">
                {contactForm.formState.isSubmitting ? 'Envoi...' : 'Envoyer'}
              </Button>
            </form>
          )}
        </Card>

        <Card className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Demande de devis</h2>
            <p className="text-sm text-muted-foreground">
              Recueillez les informations clés pour qualifier le projet.
            </p>
          </div>

          {quoteSuccess ? (
            <div className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--accent))] p-4">
              <div>
                <h3 className="text-lg font-semibold">Demande envoyée !</h3>
                <p className="text-sm text-muted-foreground">
                  Votre demande de devis est bien enregistrée. Un conseiller revient vers vous rapidement.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setQuoteSuccess(false)}>
                Envoyer une autre demande
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={quoteForm.handleSubmit(handleQuoteSubmit)}>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Type de service</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {serviceOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-3 text-sm transition hover:border-[hsl(var(--primary))]/50"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        className="peer sr-only"
                        {...quoteForm.register('service')}
                      />
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[hsl(var(--border))] peer-checked:border-[hsl(var(--primary))]">
                        <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] opacity-0 peer-checked:opacity-100" />
                      </span>
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
                {quoteErrors.service && (
                  <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.service.message}</p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Code postal</label>
                  <Input
                    placeholder="75001"
                    inputMode="numeric"
                    maxLength={5}
                    {...quoteForm.register('postalCode')}
                  />
                  {quoteErrors.postalCode && (
                    <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.postalCode.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Ville</label>
                  <Input placeholder="Paris" {...quoteForm.register('city')} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Prénom</label>
                  <Input placeholder="Jean" {...quoteForm.register('firstName')} />
                  {quoteErrors.firstName && (
                    <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Nom</label>
                  <Input placeholder="Dupont" {...quoteForm.register('lastName')} />
                  {quoteErrors.lastName && (
                    <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Email</label>
                  <Input type="email" placeholder="jean.dupont@exemple.com" {...quoteForm.register('email')} />
                  {quoteErrors.email && (
                    <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Téléphone</label>
                  <Input type="tel" placeholder="06 12 34 56 78" {...quoteForm.register('phone')} />
                  {quoteErrors.phone && (
                    <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.phone.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-3 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))]"
                    {...quoteForm.register('consent')}
                  />
                  <span>
                    J&apos;accepte d&apos;être contacté par Débarras Aurea concernant ma demande de devis.
                  </span>
                </label>
                {quoteErrors.consent && (
                  <p className="text-xs text-[hsl(var(--danger))]">{quoteErrors.consent.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Button type="submit" disabled={quoteForm.formState.isSubmitting} className="w-full">
                  {quoteForm.formState.isSubmitting ? 'Envoi...' : 'Recevoir mon devis gratuit'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">{quoteReassurance}</p>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
