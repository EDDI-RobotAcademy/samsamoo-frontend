"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreateAnonymousBoardRequest } from "@/types/anonymous-board";

export default function CreateAnonymousBoard() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<CreateAnonymousBoardRequest>({
        title: "",
        content: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert("제목을 입력해주세요.");
            return;
        }

        if (!formData.content.trim()) {
            alert("내용을 입력해주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/anonymouse-board/create`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(formData),
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                alert(`생성 실패: ${errData.detail || res.statusText}`);
                return;
            }

            await res.json();
            alert("게시글이 작성되었습니다!");
            router.push("/anonymous-board/list");
        } catch {
            alert("작성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">익명 게시글 작성</h1>
            <p className="text-gray-600 mb-4">로그인 없이 글을 작성할 수 있습니다.</p>

            <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
                {/* 제목 */}
                <div>
                    <label className="block font-semibold mb-1">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="제목을 입력하세요"
                        required
                    />
                </div>

                {/* 내용 */}
                <div>
                    <label className="block font-semibold mb-1">
                        내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.content}
                        onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="내용을 입력하세요"
                        rows={10}
                        required
                    />
                </div>

                {/* 제출 버튼 */}
                <div className="flex items-center space-x-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "작성 중..." : "작성"}
                    </button>
                    <Link
                        href="/anonymous-board/list"
                        className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                    >
                        취소
                    </Link>
                </div>
            </form>
        </div>
    );
}
