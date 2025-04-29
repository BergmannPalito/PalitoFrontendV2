// src/features/authentication/pages/ResetPasswordPage.jsx
import { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '@/config'; // Passe den Pfad ggf. an
import { useLocation, useNavigate, Link } from 'react-router-dom';
// Icons importieren
import { BsFillEyeSlashFill } from 'react-icons/bs';
import { IoEyeSharp } from 'react-icons/io5';

// Einfacher Circular Progress Indicator als Komponente (identisch zur LoginPage)
function CircularProgress() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const prefilledEmail = location.state?.email || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false); // State für Passwort-Sichtbarkeit
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setIsLoading(true); // Ladezustand aktivieren

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    cognitoUser.confirmPassword(code, newPw, {
      onSuccess: () => {
        // setIsLoading(false); // <-- DIESE ZEILE ENTFERNEN ODER AUSKOMMENTIEREN
        setMsg('Passwort wurde erfolgreich geändert. Sie werden in Kürze weitergeleitet...');
        // isLoading bleibt true während der Wartezeit
        setTimeout(() => {
             // Optional: setIsLoading(false); // Kann hier gesetzt werden, oder man lässt es weg
             navigate('/login');
            }, 3000);
      },
      onFailure: (err) => {
        setIsLoading(false); // Ladezustand bei Fehler deaktivieren
        setError(err.message || JSON.stringify(err));
      }
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <Link to="/" className={`mb-10 block text-center ${isLoading ? 'pointer-events-none opacity-50' : ''}`}> {/* Logo während Laden deaktivieren */}
          <h1 className="text-4xl font-extrabold leading-none text-emerald-600">
            Pa<span className="text-black">lito.</span>
          </h1>
        </Link>

        <div className="bg-white shadow-lg rounded-xl p-10">
          <h2 className="mb-8 text-3xl font-semibold text-center text-gray-800">
            Passwort zurücksetzen
          </h2>

          <form className="space-y-6" onSubmit={handleReset}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1 text-sm text-gray-600">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                placeholder="deine.email@beispiel.com"
                className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

             {/* Bestätigungscode */}
             <div>
              <label htmlFor="code" className="block mb-1 text-sm text-gray-600">
                Bestätigungscode (aus E-Mail)
              </label>
              <input
                id="code"
                type="text"
                placeholder="123456"
                className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* --- Neues Passwort mit Augen-Icon --- */}
            <div>
              <label htmlFor="newPassword" className="block mb-1 text-sm text-gray-600">
                Neues Passwort
              </label>
              <div className="relative flex items-center"> {/* Container für Input + Button */}
                <input
                  id="newPassword"
                  type={showNewPw ? 'text' : 'password'} // Dynamischer Typ
                  placeholder="**************"
                  // Padding rechts (pr-10) für Platz für das Icon
                  className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  disabled={isLoading}
                />
                {/* Button zum Umschalten der Sichtbarkeit */}
                <button
                  type="button" // Wichtig, damit das Formular nicht gesendet wird
                  onClick={() => setShowNewPw(!showNewPw)}
                  // Styling/Positionierung wie in LoginPage
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showNewPw ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                  disabled={isLoading} // Auch diesen Button deaktivieren
                >
                  {/* Icon basierend auf showNewPw State anzeigen */}
                  {showNewPw ? <IoEyeSharp size={18} /> : <BsFillEyeSlashFill size={18} />}
                </button>
              </div>
            </div>
            {/* --- Ende Neues Passwort mit Augen-Icon --- */}

            {/* Submit Button mit Ladeanzeige */}
            <button
              type="submit"
              className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {/* Ladeanzeige im Button bleibt aktiv, solange isLoading true ist */}
              {isLoading ? <CircularProgress /> : 'Passwort ändern'}
            </button>

            {/* Erfolgsmeldung */}
            {/* Erfolgsmeldung wird jetzt auch angezeigt, wenn isLoading true ist */}
            {msg && (
              <p className="mt-2 text-center text-sm text-green-600">{msg}</p>
            )}

             {/* Fehlermeldung */}
             {/* Fehlermeldung wird nur angezeigt, wenn *nicht* geladen wird (also nach einem Fehler) */}
            {!isLoading && error && (
              <p className="mt-2 text-center text-sm text-red-600">{error}</p>
            )}
          </form>

          {/* Link zurück zum Login */}
           <div className="mt-6 text-center text-sm">
            <Link
              to="/login"
              className={`text-emerald-600 hover:text-emerald-700 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`} // Link während Laden deaktivieren
            >
              Zurück zum Login
            </Link>
          </div>

        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} palito.app
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;