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

                {/* 공개 메뉴 */}
                <Link href="/anonymous-board/list">익명 게시판</Link>

                {/* 인증 필요한 메뉴 */}
                {isLoggedIn && (
                    <>
                        <Link href="/board/list">게시판</Link>
                        <Link href="/board/me">내 게시글</Link>
                        <Link href="/documents/list">문서 분석</Link>
                        <Link href="/financial-statements/list">재무제표 분석</Link>
                        <Link href="/faq/list">FAQ</Link>
                    </>
                )}

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
