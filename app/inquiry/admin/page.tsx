"use client";

import { useEffect, useState } from "react";
import { Inquiry } from "../types/inquiry";
import { fetchAllInquiries, answerInquiry, deleteInquiry, updateInquiry } from "../lib/inquiry";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminInquiriesPage() {
  const { isLoggedIn, role, loading } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [answerText, setAnswerText] = useState<Record<number, string>>({});
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn || role !== "ADMIN") {
      alert("권한이 없습니다.");
      setTimeout(() => router.replace("/"), 0);
      return;
    }

    loadInquiries();
  }, [isLoggedIn, role, loading, router]);

  const loadInquiries = async () => {
    try {
      const data = await fetchAllInquiries();
      setInquiries(data);
    } catch {
      alert("문의 리스트 불러오기 실패");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteInquiry(id);
      alert("삭제되었습니다.");
      loadInquiries();
    } catch {
      alert("삭제 실패");
    }
  };

  const startEditing = (i: Inquiry) => {
    if (i.status === "ANSWERED") return;
    setEditingId(i.id);
    setEditTitle(i.title);
    setEditContent(i.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEditing = async (i: Inquiry) => {
    try {
      await updateInquiry(i.id, { title: editTitle, content: editContent });
      alert("수정되었습니다.");
      cancelEditing();
      loadInquiries();
    } catch {
      alert("수정 실패");
    }
  };

  if (loading)
    return <div className="text-center mt-10 text-gray-700">로딩 중...</div>;
  if (!inquiries.length)
    return <div className="text-center mt-10 text-gray-700">문의가 없습니다.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">전체 문의 (관리자)</h1>
      <ul className="space-y-6">
        {inquiries.map((i) => (
          <li key={i.id} className="border p-4 rounded-lg shadow-sm">
            {/* 제목 & 내용 */}
            {editingId === i.id ? (
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="border p-2 rounded w-full text-black"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="border p-2 rounded w-full resize-none h-24 text-black"
                />
              </div>
            ) : (
              <>
                <p className="font-bold text-gray-900">Q. {i.title}</p>
                <p className="text-gray-800 mb-2">{i.content}</p>
              </>
            )}

            {/* 답변 작성 */}
            {i.answer ? (
              <p className="text-green-600 font-medium">A. {i.answer}</p>
            ) : (
              <div className="mt-2 flex flex-col space-y-2">
                <textarea
                  value={answerText[i.id] || ""}
                  onChange={(e) =>
                    setAnswerText((prev) => ({ ...prev, [i.id]: e.target.value }))
                  }
                  placeholder="답변 작성"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black resize-none h-24"
                />
              </div>
            )}

            {/* 버튼들: 답변 등록, 수정, 삭제 */}
            <div className="flex space-x-2 mt-2">
              {!i.answer && (
                <button
                  onClick={async () => {
                    if (!answerText[i.id]) return alert("답변 내용을 입력해주세요");
                    try {
                      await answerInquiry(i.id, { answer: answerText[i.id] });
                      alert("답변이 등록되었습니다.");
                      setAnswerText((prev) => ({ ...prev, [i.id]: "" }));
                      loadInquiries();
                    } catch {
                      alert("답변 등록 실패");
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  답변 등록
                </button>
              )}

              {editingId === i.id ? (
                <>
                  <button
                    onClick={() => saveEditing(i)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startEditing(i)}
                  className={`px-4 py-2 text-white rounded-lg ${
                    i.status === "ANSWERED"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  disabled={i.status === "ANSWERED"}
                >
                  수정
                </button>
              )}

              <button
                onClick={() => handleDelete(i.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
