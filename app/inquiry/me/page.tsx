"use client";

import { useEffect, useState } from "react";
import { Inquiry } from "../types/inquiry";
import { fetchMyInquiries, updateInquiry, deleteInquiry } from "../lib/inquiry";

export default function MyInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const data = await fetchMyInquiries();
      setInquiries(data);
    } catch (err) {
      console.error(err);
      alert("문의 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
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

  const startEditing = (inquiry: Inquiry) => {
    if (inquiry.status === "ANSWERED") return; // 답변 완료면 수정 금지
    setEditingId(inquiry.id);
    setEditTitle(inquiry.title);
    setEditContent(inquiry.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEditing = async (id: number) => {
    try {
      await updateInquiry(id, { title: editTitle, content: editContent });
      alert("수정되었습니다.");
      cancelEditing();
      loadInquiries();
    } catch {
      alert("수정 실패");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        로딩 중...
      </div>
    );

  if (!inquiries.length)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        문의가 없습니다.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">내 문의</h1>
      <div className="space-y-4">
        {inquiries.map((i) => (
          <div
            key={i.id}
            className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              {/* 제목 및 상태 + 버튼 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full justify-between">
                <h2 className="text-xl font-bold text-black">{`Q: ${i.title}`}</h2>

                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-medium ${
                      i.status === "ANSWERED"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {i.status}
                  </span>

                  <button
                    onClick={() =>
                      editingId === i.id ? saveEditing(i.id) : startEditing(i)
                    }
                    className={`px-3 py-1 text-white rounded ${
                      i.status === "ANSWERED"
                        ? "bg-gray-400 cursor-not-allowed"
                        : editingId === i.id
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    disabled={i.status === "ANSWERED"}
                  >
                    {editingId === i.id ? "저장" : "수정"}
                  </button>

                  {editingId === i.id && (
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 text-white rounded bg-gray-500 hover:bg-gray-600"
                    >
                      취소
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(i.id)}
                    className="px-3 py-1 text-white rounded bg-red-500 hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>

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
  <p className="text-gray-700 mb-2">{`내용: ${i.content}`}</p>
)}

            <p className="text-gray-400 text-sm mt-2">
              작성일: {new Date(i.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
