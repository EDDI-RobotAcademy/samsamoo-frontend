"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Board {
    id: number;
    title: string;
    content: string;
    author_nickname: string;
    created_at: string; // ISO 문자열
}

export default function BoardList() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadBoards = async (page: number) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/board/list?page=${page}&size=${size}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                console.error("Failed to fetch boards", res.status);
                setBoards([]);
                setTotal(0);
                return;
            }
            const data = await res.json();
            console.log("Fetched board list:", data); // 디버깅용
            setBoards(data.boards);
            setTotal(data.total);
        } catch (err) {
            console.error("Error loading boards:", err);
            setBoards([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBoards(page);
    }, [page]);

    const totalPages = Math.ceil(total / size);

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">게시판 목록</h1>

            <Link
                href="/board/create"
                className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
            >
                글쓰기
            </Link>

            {loading ? (
                <p className="mt-4">로딩 중...</p>
            ) : boards.length === 0 ? (
                <p className="mt-4">게시글이 없습니다.</p>
            ) : (
                <table className="w-full mt-4 border border-gray-300 text-left">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border-b">번호</th>
                        <th className="p-2 border-b">제목</th>
                        <th className="p-2 border-b">작성자</th>
                        <th className="p-2 border-b">작성일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {boards.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                            <td className="p-2 border-b">{b.id}</td>
                            <td className="p-2 border-b">
                                <Link
                                    href={`/board/${b.id}`}
                                    className="text-blue-500 hover:underline"
                                >
                                    {b.title}
                                </Link>
                            </td>
                            <td className="p-2 border-b">{b.author_nickname}</td>
                            <td className="p-2 border-b">
                                {new Date(b.created_at).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* 페이지네이션 */}
            <div className="mt-4 flex justify-center items-center space-x-4">
                <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Prev
                </button>
                <span>
                    {page} / {totalPages}
                </span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
