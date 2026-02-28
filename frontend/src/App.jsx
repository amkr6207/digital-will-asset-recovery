import { AuthProvider, useAuth } from './context/AuthContext';
import AuthCard from './components/AuthCard';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto flex max-w-6xl items-start justify-center">
        {isAuthenticated ? <Dashboard /> : <AuthCard />}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
