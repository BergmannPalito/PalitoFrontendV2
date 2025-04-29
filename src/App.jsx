// src/App.jsx
// --- Router-Import entfernt ---
import { Routes, Route, Navigate } from 'react-router-dom'; // Navigate hinzugefügt für Catch-all

// CSS-Import bleibt
import './styles/global.css';

// Auth-Komponenten und ProtectedRoute importieren
import Login from './features/authentication/pages/LoginPage.jsx';
import InviteNewPassword from './features/authentication/pages/InviteNewPasswordPage.jsx';
import ForgotPassword from './features/authentication/pages/ForgotPasswordPage.jsx';
import ResetPassword from './features/authentication/pages/ResetPasswordPage.jsx';
import HomePagePatentView from './features/patents/pages/HomePagePatentView.jsx';
import ProtectedRoute from './features/authentication/components/ProtectedRoute.jsx';

// Die alte HomePage Funktion mit Logos und Counter wird komplett entfernt.

function App() {
  // --- <Router> wurde entfernt ---
  return (
      <Routes>
        {/* Die Haupt-Route '/' wird jetzt durch ProtectedRoute geschützt */}
        <Route
          path="/" // Haupt- oder Home-Route
          element={
            <ProtectedRoute>
              <HomePagePatentView />
            </ProtectedRoute>
          }
        />
        {/* Optionale explizite /home Route, die dasselbe anzeigt */}
         <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePagePatentView />
            </ProtectedRoute>
          }
        />

        {/* Public Auth-Routen bleiben bestehen */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite" element={<InviteNewPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Die alte '/home' Route ist nicht mehr nötig, da '/' dies nun übernimmt. */}
        {/* (Die Route oben wurde zur Sicherheit drin gelassen, falls doch Links dorthin existieren) */}

        {/* Catch-all: Leitet alle unbekannten URLs zur Haupt-Route '/' weiter. */}
        {/* ProtectedRoute wird dann entscheiden, was angezeigt wird (HomePagePatentView oder Login). */}
        {/* Alternativ könnte man auch direkt zu '/login' navigieren: <Navigate to="/login" replace /> */}
        <Route
            path="*"
            element={<Navigate to="/" replace />} // Leitet zu '/' weiter
        />
      </Routes>
  );
}

export default App;