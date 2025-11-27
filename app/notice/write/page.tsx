"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function NoticeWritePage() {
  const { isLoggedIn, role } = useAuth();
  const isAdmin = role === "ADMIN";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  if (!isLoggedIn) return <div>로그인이 필요합니다.</div>;
  if (!isAdmin) return <div>관리자만 글 작성 가능</div>;

  const handleSubmit = async () => {
    const res = await fetch("http://localhost:33333/notice/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      alert("등록 완료!");
      window.location.href = "/notice/list";
    } else {
      alert("등록 실패");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">공지 작성</h1>

      <input
        className="border p-2 w-full mb-3"
        placeholder="제목 입력"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="border p-2 w-full h-40"
        placeholder="내용 입력"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleSubmit}
      >
        등록하기
      </button>
    </div>
  );
}
