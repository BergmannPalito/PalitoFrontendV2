// src/features/authentication/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
// --- Pfad-Änderung HIER ---
// Importiere useAuth aus dem neuen hooks-Verzeichnis
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  // Hole Status und Ladezustand aus dem Context via useAuth Hook
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Zeige Ladeindikator während initialer Prüfung
    return <div className="flex justify-center items-center h-screen">Authentifizierung wird geprüft...</div>;
  }

  if (!isAuthenticated) {
    // Leite zum Login weiter, wenn nicht authentifiziert
    console.log('ProtectedRoute: Not authenticated (from context), redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rendere Kinder, wenn authentifiziert
  console.log('ProtectedRoute: Authenticated (from context), rendering children.');
  return children;
}

export default ProtectedRoute;