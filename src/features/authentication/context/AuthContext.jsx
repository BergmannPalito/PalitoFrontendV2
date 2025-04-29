// src/features/authentication/context/AuthContext.jsx
import React, { useState, useEffect, useCallback } from 'react';
// --- NEU: Importiere AuthContext von nebenan ---
import { AuthContext } from './authContextTypes';
// Importiere getCurrentUser wie bisher
import { getCurrentUser } from '../../../config';

// Helper zum Dekodieren (innerhalb oder importiert)
const decodeJwtPayload = (token) => {
    if (!token) { return null; }
    try {
      const base64Url = token.split('.')[1]; if (!base64Url) { return null; }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) { console.error("AuthContext: Fehler beim Dekodieren des Tokens:", error); return { error: "Konnte Token nicht dekodieren" }; }
};

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [idTokenPayload, setIdTokenPayload] = useState(null);
  const [accessTokenPayload, setAccessTokenPayload] = useState(null);
  const rememberMeFlag = 'userShouldBeRemembered';

  const checkCognitoSession = useCallback(() => {
    return new Promise((resolve) => {
        const currentUser = getCurrentUser();
        if (!currentUser) { resolve(false); return; }
        currentUser.getSession((err, session) => {
            if (err || !session?.isValid()) { resolve(false); } else {
                try {
                    const idToken = session.getIdToken().getJwtToken();
                    const accessToken = session.getAccessToken().getJwtToken();
                    setIdTokenPayload(decodeJwtPayload(idToken));
                    setAccessTokenPayload(decodeJwtPayload(accessToken));
                    console.log('AuthProvider check: Session valid, payloads loaded.');
                    resolve(true);
                } catch (decodeError) {
                     console.error("AuthProvider check: Error decoding tokens from existing session", decodeError);
                     setIdTokenPayload(null); setAccessTokenPayload(null); resolve(false);
                }
            }
        });
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    console.log("AuthProvider: Starting initial session check...");
    checkCognitoSession().then(isValid => {
      setIsAuthenticated(isValid);
       if (!isValid) {
           setIdTokenPayload(null); setAccessTokenPayload(null);
           try {
               localStorage.removeItem(rememberMeFlag); console.log("AuthProvider: Removed rememberMe flag as initial session is invalid.");
           } catch (e) {
               console.log(e)
           }
       }
      setIsLoading(false);
      console.log(`AuthProvider: Initial check complete. isAuthenticated: ${isValid}`);
    });
  }, [checkCognitoSession]);

  const login = useCallback((session, remember) => {
    try {
        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const decodedId = decodeJwtPayload(idToken);
        const decodedAccess = decodeJwtPayload(accessToken);

        setIdTokenPayload(decodedId); setAccessTokenPayload(decodedAccess);

        if (remember) { localStorage.setItem(rememberMeFlag, 'true'); } else { localStorage.removeItem(rememberMeFlag); }
        setIsAuthenticated(true);
        console.log('AuthProvider login: User marked as authenticated, payloads stored.');

    } catch (error) {
         console.error("AuthProvider login: Error processing session tokens", error);
         setIsAuthenticated(false); setIdTokenPayload(null); setAccessTokenPayload(null);
        try {
            localStorage.removeItem(rememberMeFlag);
        } catch (e) {
            console.log(e)
        }
    }
  }, []);

  const logout = useCallback(() => {
    const currentUser = getCurrentUser(); if (currentUser) { currentUser.signOut(); }
      try {
          localStorage.removeItem(rememberMeFlag);
      } catch (e) { 
          console.log(e)
      }
    setIdTokenPayload(null); setAccessTokenPayload(null); setIsAuthenticated(false);
    console.log('AuthProvider logout: User marked as logged out, payloads cleared.');
  }, []);

  const value = {
    isAuthenticated, isLoading, login, logout,
    idTokenPayload, accessTokenPayload, checkCognitoSession
  };

  // Verwende den importierten Context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Exportiere nur die Komponente als Default
export default AuthProvider;