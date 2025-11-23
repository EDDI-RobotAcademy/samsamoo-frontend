"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnonymousBoard } from "@/types/anonymous-board";

export default function AnonymousBoardDetail() {
    const params = useParams();
    const router = useRouter();
    const boardId = params.id as string;

    const [board, setBoard] = useState<AnonymousBoard | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (boardId) {
            loadBoard();
        }
    }, [boardId]);

    const loadBoard = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/anonymouse-board/read/${boardId}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                throw new Error("Failed to load board");
            }
            const data = await res.json();
            setBoard(data);
        } catch (err) {
            console.error("Error loading board:", err);
            setError("게시글을 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
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
            router.push("/anonymous-board/list");
        } catch (err) {
            console.error("Delete error:", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <p>로딩 중...</p>
            </div>
        );
    }

    if (error && !board) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">익명 게시글</h1>
                <p className="text-red-500">{error}</p>
                <Link href="/anonymous-board/list" className="text-blue-500 hover:underline mt-4 block">
                    목록으로 돌아가기
                </Link>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <p>게시글을 찾을 수 없습니다.</p>
                <Link href="/anonymous-board/list" className="text-blue-500 hover:underline mt-4 block">
                    목록으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">익명 게시글</h1>

            {/* Board Content */}
            <div className="bg-gray-100 p-6 rounded mb-6">
                <h2 className="text-xl font-bold mb-4">{board.title}</h2>
                <div className="text-gray-600 text-sm mb-4">
                    <p>작성일: {new Date(board.created_at).toLocaleString()}</p>
                    <p>수정일: {new Date(board.updated_at).toLocaleString()}</p>
                </div>
                <div className="whitespace-pre-wrap text-gray-800">
                    {board.content}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-x-2">
                <Link
                    href="/anonymous-board/list"
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                    목록으로
                </Link>
                <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    삭제
                </button>
            </div>
        </div>
    );
}
