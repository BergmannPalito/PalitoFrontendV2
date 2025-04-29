import { useEffect, useState } from 'react';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool } from '../../../config'; // Pfad beibehalten
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BsFillEyeSlashFill } from 'react-icons/bs';
import { IoEyeSharp } from 'react-icons/io5';

// Einfacher Circular Progress Indicator (kopiert von LoginPage.jsx)
// HINWEIS: Es wäre sauberer, diese Komponente in eine eigene Datei auszulagern und zu importieren,
// wenn sie an mehreren Stellen verwendet wird.
function CircularProgress({ color = 'text-white' }) { // Füge eine Farbprop hinzu, Standard ist weiß
  return (
    <svg className={`animate-spin h-5 w-5 ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}


function InviteNewPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  const [username] = useState(query.get('username') || location.state?.email);
  const [tempPassword] = useState(query.get('tempPassword') || location.state?.tempPassword);

  const [cognitoUser, setCognitoUser] = useState(null);
  const [challengeAttrs, setChallengeAttrs] = useState({});
  const [error, setError] = useState(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    setIsLoadingInitial(true);
    setError(null);
    if (username && tempPassword) {
      const userData = { Username: username, Pool: userPool };
      const user = new CognitoUser(userData);
      const authDetails = new AuthenticationDetails({
        Username: username,
        Password: tempPassword,
      });

      // Kurze Verzögerung hinzufügen, um den Spinner sichtbar zu machen (optional, nur für Demo)
      // setTimeout(() => {
        user.authenticateUser(authDetails, {
          onSuccess: () => {
            setIsLoadingInitial(false);
            navigate('/home');
          },
          onFailure: (err) => {
            setError(err.message || JSON.stringify(err));
            setIsLoadingInitial(false);
          },
          newPasswordRequired: (userAttributes) => {
            delete userAttributes.email_verified;
            setChallengeAttrs(userAttributes);
            setCognitoUser(user);
            setIsLoadingInitial(false);
          },
        });
      // }, 500); // Beispiel: 500ms Verzögerung

    } else {
      setError("Benutzername oder temporäres Passwort fehlt.");
      setIsLoadingInitial(false);
    }
  }, [username, tempPassword, navigate]);

  const handleNewPassword = (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!cognitoUser) {
      setError("Benutzerobjekt nicht verfügbar.");
      setIsSubmitting(false);
      return;
    }

    const newPw = e.target.elements.newPassword.value;
    const attrs = { ...challengeAttrs };
    delete attrs.email;
    if (!attrs.given_name) attrs.given_name = username?.split('@')[0] || 'User';
    if (!attrs.family_name) attrs.family_name = 'User';

    cognitoUser.completeNewPasswordChallenge(newPw, attrs, {
      onSuccess: () => {
        setIsSubmitting(false);
        navigate('/home');
      },
      onFailure: (err) => {
        setError(err.message || JSON.stringify(err));
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <Link to="/" className={`mb-10 block text-center ${isSubmitting || isLoadingInitial ? 'pointer-events-none opacity-50' : ''}`}>
          <h1 className="text-4xl font-extrabold leading-none text-emerald-600">
            Pa<span className="text-black">lito.</span>
          </h1>
        </Link>

        <div className="bg-white shadow-lg rounded-xl p-10 min-h-[300px] flex flex-col justify-center"> {/* Min Höhe und Flex für Zentrierung */}
          {/* Titel (immer sichtbar) */}
          <h2 className="mb-8 text-3xl font-semibold text-center text-gray-800">
            Neues Passwort festlegen
          </h2>

          {/* Initialer Ladezustand */}
          {isLoadingInitial ? (
            <div className="flex justify-center items-center h-full"> {/* Zentrierungs-Div */}
              <CircularProgress color="text-emerald-600" /> {/* Spinner statt Text, mit grüner Farbe */}
            </div>
          ) : cognitoUser ? (
             // Formular anzeigen, wenn User-Objekt bereit ist
            <form className="space-y-6" onSubmit={handleNewPassword}>
              {/* Neues Passwort Eingabe */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block mb-1 text-sm text-gray-600"
                >
                  Neues Passwort
                </label>
                <div className="relative flex items-center">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPw ? 'text' : 'password'}
                    placeholder="**************"
                    className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                    disabled={isSubmitting} // Deaktivieren während Submit
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPw ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                    disabled={isSubmitting} // Deaktivieren während Submit
                  >
                    {showPw ? <IoEyeSharp size={18} /> : <BsFillEyeSlashFill size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button mit Ladeanzeige */}
              <button
                type="submit"
                className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting} // Deaktivieren während Submit
              >
                {isSubmitting ? <CircularProgress color="text-white"/> : 'Passwort setzen'} {/* Spinner mit weißer Farbe */}
              </button>

              {/* Fehleranzeige */}
              {error && !isSubmitting && ( // Nur anzeigen, wenn nicht gerade gesendet wird
                <p className="mt-2 text-center text-sm text-red-600">{error}</p>
              )}
            </form>
          ) : (
             // Fehler anzeigen, wenn Initialisierung fehlschlug (z.B. kein User-Objekt)
             error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} palito.app
        </p>
      </div>
    </div>
  );
}

export default InviteNewPasswordPage;