// src/features/patents/pages/HomePagePatentView.jsx
/*
import React from 'react'; // useState, useEffect entfernt
import { useNavigate } from 'react-router-dom';
// getCurrentUser wird hier nicht mehr benötigt
// import { getCurrentUser } from '../../../config';
// Importiere useAuth vom neuen Speicherort
import { useAuth } from '../../authentication/hooks/useAuth';

// decodeJwtPayload wird nicht mehr hier benötigt, da die Payloads aus dem Context kommen
/*
function decodeJwtPayload(token) {
 // ...
}
*/
/*
function HomePagePatentView() {
  const navigate = useNavigate();
  // --- Geändert: Hole Payloads und Logout direkt aus dem Context ---
  const { logout, idTokenPayload, accessTokenPayload, isLoading: isAuthLoading } = useAuth();

  // Logout-Handler, der die Context-Funktion nutzt
  const handleLogout = () => {
    console.log('HomePage: handleLogout called');
    logout(); // Rufe die Logout-Funktion aus dem Context auf
    navigate('/login'); // Navigiere zum Login
  };

  // --- Rendering-Logik ---

  // Warte, bis der AuthProvider seine initiale Prüfung abgeschlossen hat
  if (isAuthLoading) {
       return <div className="flex justify-center items-center h-screen">Authentifizierung wird geprüft...</div>;
  }

   // Fallback, falls Payloads nach dem Laden nicht da sind (sollte dank ProtectedRoute nicht passieren)
   if (!idTokenPayload || !accessTokenPayload) {
        console.error("HomePage Render Error: Payloads missing after auth loading finished.");
        // Zeige eine Fehlermeldung oder leite direkt aus (obwohl ProtectedRoute dies verhindern sollte)
        // handleLogout(); // Logout erzwingen?
        return <div className="p-4 text-red-600">Fehler: Benutzerdaten nicht verfügbar. Bitte erneut anmelden.</div>;
   }

  // Erfolgreiche Anzeige mit Daten aus dem Context
  return (
    <div className="p-4 relative">
      
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      >
        Abmelden
      </button>

      <h2 className="text-2xl font-bold mb-4">Willkommen im Patent View</h2>
      <p className="mb-6">Nur für eingeloggte Benutzer sichtbar.</p>

     
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">ID Token Payload (aus Context):</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap break-all">
          {JSON.stringify(idTokenPayload, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Access Token Payload (aus Context):</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto whitespace-pre-wrap break-all">
           {JSON.stringify(accessTokenPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default HomePagePatentView;
*/
// src/features/patents/pages/HomePagePatentView.jsx
// NO CHANGES NEEDED - Keep the existing code

// src/features/patents/pages/HomePagePatentView.jsx
import { PatentWorkspaceProvider } from '../context/PatentWorkspaceContext';
import { CommentsProvider } from '../context/CommentsContext'; // Import CommentsProvider
import Sidebar from '../components/Sidebar/Sidebar';
import TabWorkspace from '../components/TabWorkspace/TabWorkspace';

export default function HomePagePatentView() {
  return (
    <PatentWorkspaceProvider>
      {/* Wrap the part of the app that needs comment context */}
      {/* Placing it here makes it available to TabWorkspace and its children */}
      <CommentsProvider>
        <div className="flex h-screen bg-white">
          <Sidebar />
          <TabWorkspace />
        </div>
      </CommentsProvider>
    </PatentWorkspaceProvider>
  );
}