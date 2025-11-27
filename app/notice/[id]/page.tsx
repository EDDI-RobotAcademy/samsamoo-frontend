"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const { isLoggedIn, role, loading } = useAuth();
  const isAdmin = role === "ADMIN";

  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:33333/notice/${id}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not Found");
        return res.json();
      })
      .then((data) => setNotice(data))
      .catch((err) => setError(err.message));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) return <div>로그인이 필요합니다.</div>;
  if (error) return <div>Error: {error}</div>;
  if (!notice) return <div>공지사항을 찾을 수 없습니다.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{notice.title}</h1>
      <p className="mt-4 whitespace-pre-line">{notice.content}</p>

      <small className="text-gray-500 mt-2 block">
        작성일: {new Date(notice.created_at).toLocaleString()}
      </small>

      <div className="flex gap-2 mt-4">
        {isAdmin && (
          <>
            <button
              className="px-3 py-1 bg-yellow-500 text-white rounded"
              onClick={() => router.push(`/notice/${id}/edit`)}
            >
              수정
            </button>

            <button
              className="px-3 py-1 bg-red-500 text-white rounded"
              onClick={handleDelete}
            >
              삭제
            </button>
          </>
        )}

        <button
          className="px-3 py-1 bg-gray-400 text-white rounded"
          onClick={() => router.push("/notice/list")}
        >
          목록으로
        </button>
      </div>
    </div>
  );

  function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`http://localhost:33333/notice/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          alert("삭제되었습니다.");
          router.push("/notice/list");
        } else {
          alert("삭제 실패");
        }
      })
      .catch((err) => alert("삭제 중 오류 발생: " + err.message));
  }
}
