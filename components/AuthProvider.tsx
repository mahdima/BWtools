"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    isLoggedIn: boolean;
    login: (email: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check local storage on mount (simulating session check)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setIsLoggedIn(true);
        }
    }, []);

    const login = (email: string) => {
        localStorage.setItem('user', email);
        setIsLoggedIn(true);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
