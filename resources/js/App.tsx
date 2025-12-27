import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layouts
import { DefaultLayout, AuthLayout } from './layouts';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// App Pages
import Dashboard from './pages/dashboard/Dashboard';
import TasksIndex from './pages/tasks/TasksIndex';
import TaskView from './pages/tasks/TaskView';
import ObligationsIndex from './pages/obligations/ObligationsIndex';
import CompaniesIndex from './pages/companies/CompaniesIndex';
import TeamsIndex from './pages/teams/TeamsIndex';
import UsersIndex from './pages/users/UsersIndex';
import Profile from './pages/users/Profile';

// Error Pages
import NotFound from './pages/errors/NotFound';

// Components
import { ScreenLoader } from './components/screen-loader';

interface RouteGuardProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DefaultLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<TasksIndex />} />
        <Route path="/tasks/:id" element={<TaskView />} />
        <Route path="/obligations" element={<ObligationsIndex />} />
        <Route path="/companies" element={<CompaniesIndex />} />
        <Route path="/teams" element={<TeamsIndex />} />
        <Route path="/users" element={<UsersIndex />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
