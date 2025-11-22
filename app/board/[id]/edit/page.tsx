"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Board {
    id: number;
    title: string;
    content: string;
    author_id: number;
}

export default function BoardUpdate() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [board, setBoard] = useState<Board | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
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
                const data: Board = await res.json();
                setBoard(data);
                setTitle(data.title || "");
                setContent(data.content || "");
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBoard();
    }, [id]);

    const handleUpdate = async () => {
        if (!id) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/board/update/${id}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title, content }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `Update failed: ${res.status}`);
            }

            router.push(`/board/${id}`);
        } catch (err: any) {
            console.error(err);
            alert("수정에 실패했습니다: " + err.message);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!board) return <div>게시글이 존재하지 않습니다.</div>;

    return (
        <div className="p-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl font-bold mb-4">게시글 수정</h1>

            <input
                className="border p-2 w-full mb-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
            />

            <textarea
                className="border p-2 w-full h-64 mb-3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용"
            />

            <div className="flex gap-2">
                <button
                    onClick={handleUpdate}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                    수정
                </button>

                <button
                    onClick={() => router.back()}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                >
                    뒤로가기
                </button>
            </div>
        </div>
    );
}
