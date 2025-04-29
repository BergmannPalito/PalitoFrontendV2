// src/features/authentication/hooks/useAuth.js
import { useContext } from 'react';
// --- NEU: Importiere AuthContext aus der neuen Datei ---
import { AuthContext } from '../context/authContextTypes'; // Pfad zur neuen Datei

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};