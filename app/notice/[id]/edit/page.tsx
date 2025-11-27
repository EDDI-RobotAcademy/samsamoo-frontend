"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NoticeEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch(`http://localhost:33333/notice/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
      });
  }, [id]);

  const update = () => {
    fetch(`http://localhost:33333/notice/update/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    }).then(() => router.push(`/notice/${id}`));
  };

  return (
    <div className="p-6">
      <h1>공지사항 수정</h1>

      <input
        className="border p-2 w-full mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="border p-2 w-full h-40 mb-3"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button className="bg-blue-600 px-4 py-2 text-white rounded" onClick={update}>
        수정 완료
      </button>
    </div>
  );
}
