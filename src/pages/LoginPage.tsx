import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../app/providers/authContext'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe requis'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const onSubmit = async (values: FormValues) => {
    await login(values.email, values.password)
    const destination = (location.state as { from?: string } | null)?.from || '/dashboard'
    navigate(destination)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--muted))] px-4">
      <Card className="w-full max-w-md">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Connexion</h1>
          <p className="text-sm text-muted-foreground">Accédez à votre espace administrateur.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Email</label>
            <Input type="email" placeholder="admin@exemple.com" {...register('email')} />
            {errors.email && <p className="text-xs text-[hsl(var(--danger))]">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold">Mot de passe</label>
            <Input type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && (
              <p className="text-xs text-[hsl(var(--danger))]">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
