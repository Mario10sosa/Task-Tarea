import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailsPage } from './pages/ProjectDetails';
import { InvitationLandingPage } from './pages/InvitationLanding';
import { InvitationsPage } from './pages/Invitations';
import { useAuth } from './store/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((state) => state.token);
  // Si ya tiene sesión activa, redirigir al dashboard
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-center" expand={false} richColors />
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas — redirigen al dashboard si ya hay sesión */}
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Invitación — siempre accesible */}
            <Route path="/invitation/:token" element={<InvitationLandingPage />} />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              <Route path="invitations"  element={<InvitationsPage />} />
            </Route>

            {/* Cualquier ruta desconocida → login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;