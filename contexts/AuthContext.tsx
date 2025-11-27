"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
    isLoggedIn: boolean;
    role: string | null;
    email: string | null;
    nickname: string | null;
    loading: boolean;
    refresh: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    role: null,
    email: null,
    nickname: null,
    loading: true,
    refresh: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = () => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/status`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setIsLoggedIn(data.isLoggedIn === true);
                setRole(data.role || null);
                setEmail(data.email || null);
                setNickname(data.nickname || null);
            })
            .catch(() => {
                setIsLoggedIn(false);
                setRole(null);
                setEmail(null);
                setNickname(null);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const logout = () => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/logout`, {
            method: "POST",
            credentials: "include",
        }).finally(() => {
            setIsLoggedIn(false);
            setRole(null);
            setEmail(null);
            setNickname(null);
        });
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <AuthContext.Provider
            value={{ isLoggedIn, role, email, nickname, loading, refresh, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
