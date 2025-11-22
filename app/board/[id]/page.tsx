"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Board {
    id: number;
    title: string;
    content: string;
    author_id: number;
}

export default function BoardDetailClient() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [board, setBoard] = useState<Board | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchBoard = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/board/read/${id}`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                setBoard(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBoard();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/board/delete/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Delete failed: ${res.status}`);
            }
            router.push("/board/list");
        } catch (err: any) {
            console.error(err);
            alert("삭제에 실패했습니다: " + err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!board) return <div>게시글이 존재하지 않습니다.</div>;

    return (
        <div className="p-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl font-bold">{board.title}</h1>
            <p className="my-4 whitespace-pre-line">{board.content}</p>

            <div className="mt-4 flex gap-2">
                <Link
                    href={`/board/${id}/edit`}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                    수정
                </Link>

                <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                >
                    삭제
                </button>

                <button
                    onClick={() => router.push("/board/list")}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                >
                    뒤로가기
                </button>

            </div>
        </div>
    );
}
