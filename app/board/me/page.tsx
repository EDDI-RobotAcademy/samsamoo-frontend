"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Board {
    id: number;
    title: string;
    content: string;
    author_nickname: string;
    created_at: string;
}

export default function MyBoards() {
    const { isLoggedIn } = useAuth();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(false);

    const loadMyBoards = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/board/me`,
                { credentials: "include" }
            );
            if (!res.ok) {
                setBoards([]);
                return;
            }
            const data = await res.json();
            setBoards(data.boards || data);
        } catch {
            setBoards([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadMyBoards();
        }
    }, [isLoggedIn]);

    const handleDelete = async (boardId: number) => {
        if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/board/delete/${boardId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) {
                alert("삭제 실패: " + res.statusText);
                return;
            }
            alert("게시글이 삭제되었습니다.");
            loadMyBoards();
        } catch {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">내 게시글</h1>
                <p>로그인이 필요한 서비스입니다.</p>
                <Link href="/login" className="text-blue-500 hover:underline">
                    로그인하러 가기
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">내 게시글</h1>

            <div className="mb-4 space-x-2">
                <Link
                    href="/board/create"
                    className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
                >
                    글쓰기
                </Link>
                <Link
                    href="/board/list"
                    className="bg-gray-600 px-4 py-2 rounded text-white hover:bg-gray-700"
                >
                    전체 게시판 보기
                </Link>
            </div>

            {loading ? (
                <p className="mt-4">로딩 중...</p>
            ) : boards.length === 0 ? (
                <div className="mt-4">
                    <p className="mb-2">작성한 게시글이 없습니다.</p>
                    <Link href="/board/create" className="text-blue-500 hover:underline">
                        첫 게시글 작성하기
                    </Link>
                </div>
            ) : (
                <table className="w-full mt-4 border border-gray-300 text-left">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border-b">번호</th>
                        <th className="p-2 border-b">제목</th>
                        <th className="p-2 border-b">작성일</th>
                        <th className="p-2 border-b">액션</th>
                    </tr>
                    </thead>
                    <tbody>
                    {boards.map((b) => (
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
                            <td className="p-2 border-b">
                                {new Date(b.created_at).toLocaleString()}
                            </td>
                            <td className="p-2 border-b space-x-2">
                                <Link
                                    href={`/board/${b.id}/edit`}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                >
                                    수정
                                </Link>
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
