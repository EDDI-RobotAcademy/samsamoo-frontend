"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticePage() {
  const router = useRouter();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn, role, loading } = useAuth();
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    fetch("http://localhost:33333/notice/list", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const noticeList: Notice[] = Array.isArray(data) ? data : data.notices ?? [];
        setNotices(noticeList);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) return <div>로그인이 필요합니다.</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">공지사항</h1>

      <div className="mb-4">
        관리자 여부: {isAdmin ? "예" : "아니오"} (role: {role})
      </div>

      {isAdmin && (
        <button
          className="px-4 py-2 mb-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push("/notice/write")}
        >
          글 작성하기
        </button>
      )}

      <ul className="space-y-4">
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="border p-4 rounded shadow-sm cursor-pointer hover:bg-gray-100 transition"
            onClick={() => router.push(`/notice/${notice.id}`)}
          >
            <h2 className="text-lg font-semibold">{notice.title}</h2>
            <p className="text-gray-700 mt-1 line-clamp-2">{notice.content}</p>
            <small className="text-gray-500 mt-2 block">
              {new Date(notice.created_at).toLocaleString()}
            </small>

            {/* ⭐ 관리자만 수정/삭제 버튼 표시 — 클릭 버블링 막기 */}
            {isAdmin && (
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/notice/${notice.id}/edit`);
                  }}
                >
                  수정
                </button>

                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notice.id);
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  function handleDelete(id: number) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`http://localhost:33333/notice/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          alert("삭제되었습니다.");
          setNotices((prev) => prev.filter((n) => n.id !== id));
        } else {
          alert("삭제 실패");
        }
      })
      .catch((err) => alert("삭제 중 오류 발생: " + err.message));
  }
}
