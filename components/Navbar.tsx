"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { isLoggedIn, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <nav className="bg-gray-800 text-white p-4 flex justify-between">
            <div className="text-lg font-bold">
                <Link href="/">MyApp</Link>
            </div>

            <div className="space-x-4">
                <Link href="/">Home</Link>
                <Link href="/documents/list">문서 분석</Link>
                <Link href="/contact">Contact</Link>

                {/* 게시판 메뉴 추가 */}
                <Link href="/board/list">게시판</Link>

                {isLoggedIn ? (
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
