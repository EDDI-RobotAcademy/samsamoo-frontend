"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
    isLoggedIn: boolean;
    role: string | null;
    loading: boolean;
    refresh: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    role: null,
    loading: true,
    refresh: async () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

<<<<<<< HEAD
    const refresh = () => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/status`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setIsLoggedIn(data.logged_in);
            })
            .catch(() => {
                setIsLoggedIn(false);
            });
    };

    const logout = () => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/logout`, {
            method: "POST",
            credentials: "include",
        }).finally(() => {
=======
    const refresh = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/status`, {
                credentials: "include",
            });
            const data = await res.json();
            setIsLoggedIn(data.logged_in);
            setRole(data.role ?? null);
        } catch (err) {
            console.error("[Auth] Status check failed:", err);
>>>>>>> c38c6d7 (feat: [ith] 사용자의 권한에 따라 접근 가능 페이지  제어 [SOF-17])
            setIsLoggedIn(false);
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setIsLoggedIn(false);
            setRole(null);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, role, loading, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
