"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ 추가

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticePage() {
  const router = useRouter(); // ✅ 라우터 훅 사용

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 관리자 여부 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:33333/authentication/me", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setIsAdmin(String(data.role).toUpperCase() === "ADMIN");
      } catch (err: any) {
        console.error("사용자 정보 로드 실패:", err.message);
      }
    };
    fetchUser();
  }, []);

  // 공지사항 목록 가져오기
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch("http://localhost:33333/notice/list", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();

        const noticeList: Notice[] = Array.isArray(data)
          ? data
          : data.notices ?? [];
        setNotices(noticeList);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (notices.length === 0) return <div>공지사항이 없습니다.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">공지사항</h1>
      <div className="mb-4">관리자 여부: {isAdmin ? "예" : "아니오"}</div>

      {isAdmin && (
        <button
          className="px-4 py-2 mb-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => router.push("/notice/write")} // ✅ push로 변경
        >
          글 작성하기
        </button>
      )}

      <ul className="space-y-4">
        {notices.map((notice) => (
          <li
            key={notice.id}
            className="border p-4 rounded shadow-sm cursor-pointer hover:bg-gray-100"
            onClick={() => router.push(`/notice/${notice.id}?admin=${isAdmin ? 1 : 0}`)}
          >
            <h2 className="text-lg font-semibold text-gray-100">
              {notice.title}
            </h2>
            <p className="text-gray-300 mt-1 line-clamp-2">
              {notice.content}
            </p>
            <small className="text-gray-500 mt-2 block">
              {new Date(notice.created_at).toLocaleString()}
            </small>

            {isAdmin && (
              <button
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation(); // ✅ 클릭 이벤트 버블링 방지
                  handleDelete(notice.id);
                }}
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  async function handleDelete(id: number) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`http://localhost:33333/notice/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        alert("삭제되었습니다.");
        setNotices((prev) => prev.filter((n) => n.id !== id));
      } else {
        alert("삭제 실패");
      }
    } catch (err: any) {
      alert("삭제 중 오류 발생: " + err.message);
    }
  }
}
