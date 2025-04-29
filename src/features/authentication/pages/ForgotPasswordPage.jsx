// src/features/authentication/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '@/config'; // Passe ggf. den Pfad an deine Konfiguration an
import { useNavigate, Link } from 'react-router-dom';

// Einfacher Circular Progress Indicator als Komponente (wie in LoginPage.jsx)
function CircularProgress() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Ladezustand hinzugefügt
  const navigate = useNavigate();

  const handleForgot = (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setIsLoading(true); // Ladezustand aktivieren

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool //
    });

    cognitoUser.forgotPassword({
      onSuccess: (data) => {
        // Normalerweise nicht hier erreicht, da inputVerificationCode genutzt wird
        console.log('Passwort-Reset (Step1) success:', data);
        // Sicherheitshalber Ladezustand hier auch deaktivieren, falls dieser Pfad doch erreicht wird
        setIsLoading(false);
      },
      onFailure: (err) => {
        setIsLoading(false); // Ladezustand deaktivieren bei Fehler
        setError(err.message || JSON.stringify(err));
      },
      inputVerificationCode: (data) => {
        console.log('Code gesendet an:', data.CodeDeliveryDetails.Destination);
        setMsg('Ein Bestätigungscode wurde an Ihre E-Mail gesendet. Sie werden gleich weitergeleitet.');
        // setIsLoading(false); // <-- DIESE ZEILE ENTFERNEN ODER AUSKOMMENTIEREN

        // Autom. Weiterleitung zum zweiten Schritt nach kurzer Anzeige der Nachricht
        // isLoading bleibt true während der Wartezeit
        setTimeout(() => {
          // Optional: setIsLoading(false); // Kann hier gesetzt werden, oder man lässt es weg, da die Komponente eh verschwindet
          navigate('/reset-password', { state: { email } }); //
        }, 2500); // Etwas längere Anzeigezeit für die Nachricht
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
          <h2 className="mb-4 text-3xl font-semibold text-center text-gray-800">
            Passwort vergessen?
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            Kein Problem! Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Code zum Zurücksetzen.
          </p>

          <form className="space-y-6" onSubmit={handleForgot}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1 text-sm text-gray-600">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="ihremail@mail.com"
                className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading} // Eingabefeld während des Ladens deaktivieren
              />
            </div>


            {/* Submit Button mit Ladeanzeige */}
            <button
              type="submit"
              className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading} // Button während des Ladens deaktivieren
            >
              {/* Ladeanzeige im Button bleibt aktiv, solange isLoading true ist */}
              {isLoading ? <CircularProgress /> : 'Code anfordern'}
            </button>

             {/* Erfolgs- oder Fehlermeldung unter dem Button */}
             {/* Erfolgsmeldung wird jetzt auch angezeigt, wenn isLoading true ist */}
             {msg && (
               <p className="mt-4 text-center text-sm text-green-600">{msg}</p>
             )}
             {/* Fehlermeldung wird nur angezeigt, wenn *nicht* geladen wird (also nach einem Fehler) */}
             {!isLoading && error && (
               <p className="mt-4 text-center text-sm text-red-600">{error}</p>
             )}

          </form>

           {/* Link zurück zum Login */}
           <div className="mt-6 text-center text-sm">
                <Link
                    to="/login" // Passe ggf. den Pfad zu deiner Login-Seite an
                    className={`text-emerald-600 hover:text-emerald-700 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`} // Link während des Ladens deaktivieren
                >
                   Zurück zum Login
                </Link>
            </div>
        </div>

        <p className="mt-12 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} palito.app
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;