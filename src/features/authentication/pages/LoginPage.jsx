// src/features/authentication/pages/LoginPage.jsx
import { useState } from 'react';
import { AuthenticationDetails } from 'amazon-cognito-identity-js';
import { getCognitoUser } from '@/config';
import { Link, useNavigate } from 'react-router-dom';
import { BsFillEyeSlashFill } from 'react-icons/bs';
import { IoEyeSharp } from 'react-icons/io5';
import { useAuth } from '../hooks/useAuth';

// CircularProgress Komponente... (unverändert)
function CircularProgress() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}


export default function LoginPage() {
  // States... (unverändert)
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const rememberMeFlag = 'userShouldBeRemembered';
  const [rememberMe, setRememberMe] = useState(() => {
     try { return localStorage.getItem(rememberMeFlag) === 'true'; } catch { return false; }
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    const cognitoUser = getCognitoUser(email, storage);
    const authDetails = new AuthenticationDetails({ Username: email, Password: pw });

    cognitoUser.authenticateUser(authDetails, {
      // --- Geändert: Übergibt 'session' an context.login ---
      onSuccess: (session) => { // session Objekt ist hier verfügbar
        console.log('Cognito Login Success (onSuccess callback)');
        // Übergib das session-Objekt und rememberMe an die Context-Login-Funktion
        login(session, rememberMe);

        setIsLoading(false);
        navigate('/home');
      },
      onFailure: (err) => {
        setIsLoading(false);
        setError(err.message || JSON.stringify(err));
        try {
          localStorage.removeItem(rememberMeFlag);
        } catch (e) {
          console.log(e)
         }
      },
      newPasswordRequired: () => {
        setIsLoading(false);
        try {
          localStorage.removeItem(rememberMeFlag);
        } catch (e) {
          console.log(e)
         }
        navigate('/invite', { state: { email, tempPassword: pw } });
      },
    });
  };

  // --- JSX bleibt unverändert ---
  return (
      // ... (Komplettes JSX wie in der vorherigen Antwort) ...
       <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <Link to="/" className="mb-10 block text-center">
          <h1 className="text-4xl font-extrabold leading-none text-emerald-600">
            Pa<span className="text-black">lito.</span>
          </h1>
        </Link>

        <div className="bg-white shadow-lg rounded-xl p-10">
          <h2 className="mb-8 text-3xl font-semibold text-center text-gray-800">
            Welcome back
          </h2>

          <form className="space-y-6" onSubmit={onSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-1 text-sm text-gray-600">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="samplemail@mail.com"
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className="block mb-1 text-sm text-gray-600">
                    Password
                </label>
                <div className="relative flex items-center">
                <input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="**************"
                    autoComplete="current-password"
                    className="w-full rounded-md border border-gray-300 bg-[#EEF3FF] px-3 py-2 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    required
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                >
                    {showPw ? <IoEyeSharp size={18} /> : <BsFillEyeSlashFill size={18} />}
                </button>
                </div>
            </div>

            {/* Checkbox + Link */}
            <div className="flex flex-wrap items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span htmlFor="remember-me" className="select-none">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className={`text-emerald-600 underline hover:text-emerald-700 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button mit Ladeanzeige */}
            <button
              type="submit"
              className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress /> : 'Login'}
            </button>

            {error && !isLoading && (
              <p className="mt-2 text-center text-sm text-red-600">{error}</p>
            )}
          </form>
        </div>

        <p className="mt-12 text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} palito.app
        </p>
      </div>
    </div>
  );
}