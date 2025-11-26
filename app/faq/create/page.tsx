"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BoardCreate() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    async function handleSubmit() {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/board/create`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",   // 로그인 쿠키 전달
                body: JSON.stringify({ title, content }),
            }
        );

        if (!res.ok) {
            alert("작성 실패!");
            return;
        }

        const data = await res.json();
        // 생성된 게시글 ID로 상세 페이지로 이동
        router.push(`/board/${data.id}`);
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">게시글 작성</h1>

            <input
                className="border p-2 w-full mb-3"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                className="border p-2 w-full mb-3"
                placeholder="내용"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded"
            >
                저장하기
            </button>
        </div>
    );
}
