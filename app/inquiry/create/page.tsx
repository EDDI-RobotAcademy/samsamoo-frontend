"use client";

import { useState } from "react";
import { createInquiry } from "../lib/inquiry";
import { useRouter } from "next/navigation";

export default function CreateInquiryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title || !content) return alert("제목과 내용을 입력해주세요");
    setLoading(true);
    try {
      await createInquiry({ title, content });
      alert("문의가 등록되었습니다.");
      setTitle("");
      setContent("");
      router.push("/inquiry/me"); // 작성 후 내 문의 페이지로 이동 가능
    } catch (e) {
      alert("문의 등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-black font-bold mb-2 text-center">1:1 문의 작성</h1>
        <label className="block mb-2 font-medium text-gray-700">제목</label>
        <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500 text-black"
        />

        <label className="block mb-2 font-medium text-gray-700">내용</label>
        <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용을 입력하세요"
        className="w-full mb-4 p-3 border border-gray-300 rounded-lg h-36 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none placeholder-gray-500 text-black"
        />

      <div className="flex items-center justify-between">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "등록중..." : "등록"}
        </button>

        <button
          onClick={() => router.push("/inquiry/me")}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-medium text-gray-700"
        >
          내 문의
        </button>
      </div>
    </div>
  );
}
