// src/config/index.js
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

// Basis-Konfiguration ohne Storage
const poolData = {
  UserPoolId: 'eu-central-1_vGdERMwAc',  // Dein Wert
  ClientId: '4gni3hhobn2fa2l5j01kj4acsg', // Dein Wert
};

// Cache für User Pool Instanzen
let userPoolLocalStorageInstance = null;
let userPoolSessionStorageInstance = null;

function getUserPoolInstance(storageType) {
    if (storageType === window.localStorage) {
        if (!userPoolLocalStorageInstance) {
            console.log("Creating CognitoUserPool instance for localStorage");
            userPoolLocalStorageInstance = new CognitoUserPool({ ...poolData, Storage: storageType });
        }
        return userPoolLocalStorageInstance;
    } else { // Default to sessionStorage
        if (!userPoolSessionStorageInstance) {
            console.log("Creating CognitoUserPool instance for sessionStorage");
            userPoolSessionStorageInstance = new CognitoUserPool({ ...poolData, Storage: storageType });
        }
        return userPoolSessionStorageInstance;
    }
}

// Diese Funktion nutzt jetzt die gecachte Instanz
export const getCognitoUser = (username, storageType = window.localStorage) => {
    const dynamicUserPool = getUserPoolInstance(storageType); // Holt die passende Instanz
    return new CognitoUser({ Username: username, Pool: dynamicUserPool });
};

// Diese Funktion nutzt jetzt auch die gecachte Instanz
export const getCurrentUser = () => {
   let storageToUse = window.sessionStorage;
   const rememberMeFlag = 'userShouldBeRemembered';

   try {
     const shouldRemember = localStorage.getItem(rememberMeFlag);
     if (shouldRemember === 'true') {
       storageToUse = window.localStorage;
     }
   } catch (e) {
     console.error("Error reading rememberMe flag from localStorage:", e);
   }

    const dynamicUserPool = getUserPoolInstance(storageToUse);
    return dynamicUserPool.getCurrentUser();
}

// --- ÄNDERUNG HIER: Export wieder aktivieren ---
// Exportiere die Basis-Instanz wieder für Flows, die keinen spezifischen Storage brauchen (z.B. Passwort-Reset)
export const userPool = new CognitoUserPool(poolData);