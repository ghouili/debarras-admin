import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './routes/RequireAuth'
import { AdminShell } from '../components/layout/AdminShell'
import { LoginPage } from '../pages/LoginPage.tsx'
import { DashboardPage } from '../pages/DashboardPage.tsx'
import { UsersPage } from '../pages/UsersPage.tsx'
import { ContactsPage } from '../pages/ContactsPage.tsx'
import { QuoteRequestsPage } from '../pages/QuoteRequestsPage.tsx'
import { LeadFormsPage } from '../pages/LeadFormsPage.tsx'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AdminShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/users',
        element: <UsersPage />,
      },
      {
        path: '/contacts',
        element: <ContactsPage />,
      },
      {
        path: '/quote-requests',
        element: <QuoteRequestsPage />,
      },
      {
        path: '/lead-forms',
        element: <LeadFormsPage />,
      },
    ],
  },
])
