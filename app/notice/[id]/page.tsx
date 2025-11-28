"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  // ✅ 쿼리에서 넘어온 admin 플래그 (0/1)
  const adminQuery = searchParams.get("admin");
  const isAdminUI = adminQuery === "1";

  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:33333";

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/notice/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not Found");
        return res.json();
      })
      .then((data) => setNotice(data))
      .catch((err) => setError(err.message));
  }, [API, id]);

  if (error) return <div>Error: {error}</div>;
  if (!notice) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{notice.title}</h1>
      <p className="mt-4 whitespace-pre-wrap">{notice.content}</p>
      <small className="text-gray-500 mt-2 block">
        작성일: {new Date(notice.created_at).toLocaleString()}
      </small>

      <div className="flex gap-2 mt-4">
        {/* ✅ 쿼리 기준으로만 버튼 노출 */}
        {isAdminUI && (
          <>
            <button
              className="px-3 py-1 bg-yellow-500 text-white rounded"
              onClick={() => router.push(`/notice/${id}/edit?admin=1`)}
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
          className="px-3 py-1 bg-gray-500 text-white rounded"
          onClick={() => router.push("/notice/list")}
        >
          목록으로
        </button>
      </div>
    </div>
  );

  function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    fetch(`${API}/notice/delete/${id}`, { method: "DELETE", credentials: "include" })
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
