"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnonymousBoard } from "@/types/anonymous-board";

export default function AnonymousBoardList() {
    const [boards, setBoards] = useState<AnonymousBoard[]>([]);
    const [loading, setLoading] = useState(false);

    const loadBoards = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/anonymouse-board/list`,
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
        loadBoards();
    }, []);

    const handleDelete = async (boardId: number) => {
        if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/anonymouse-board/delete/${boardId}`,
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
            loadBoards();
        } catch {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">익명 게시판</h1>
            <p className="text-gray-600 mb-4">로그인 없이 누구나 글을 작성하고 읽을 수 있습니다.</p>

            <Link
                href="/anonymous-board/create"
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
                                    href={`/anonymous-board/${b.id}`}
                                    className="text-blue-500 hover:underline"
                                >
                                    {b.title}
                                </Link>
                            </td>
                            <td className="p-2 border-b">
                                {new Date(b.created_at).toLocaleString()}
                            </td>
                            <td className="p-2 border-b">
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
