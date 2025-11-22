"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
    isLoggedIn: boolean;
    refresh: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isLoggedIn: false,
    refresh: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const refresh = () => {
        console.log("[Auth] Checking login status...");
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/status`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                console.log("[Auth] Status API response:", data);
                setIsLoggedIn(data.logged_in);
            })
            .catch((err) => {
                console.error("[Auth] Status check failed:", err);
                setIsLoggedIn(false);
            });
    };

    const logout = () => {
        console.log("[Auth] Logging out...");
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/authentication/logout`, {
            method: "POST",
            credentials: "include",
        }).finally(() => {
            setIsLoggedIn(false);
        });
    };

    // 처음 로딩될 때 1번만 실행
    useEffect(() => {
        refresh();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, refresh, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
