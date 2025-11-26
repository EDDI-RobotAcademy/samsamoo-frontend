import { Inquiry, InquiryCreateRequest, InquiryAnswerRequest } from "../types/inquiry";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/inquiries`;

export async function fetchMyInquiries(): Promise<Inquiry[]> {
  const res = await fetch(`${BASE_URL}/me`, { credentials: "include" });
  if (!res.ok) throw new Error("내 문의 목록 조회 실패");
  return res.json();
}

export async function fetchAllInquiries(): Promise<Inquiry[]> {
  const res = await fetch(`${BASE_URL}`, { credentials: "include" });
  if (res.status === 403) {
    throw new Error("FORBIDDEN"); // 403이면 에러 던짐
  }
  if (!res.ok) {
    throw new Error("전체 문의 조회 실패"); // 그 외 에러 처리
  }
  return res.json();
}


export async function createInquiry(data: InquiryCreateRequest): Promise<Inquiry> {
  const res = await fetch(`${BASE_URL}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("문의 생성 실패");
  return res.json();
}

export async function answerInquiry(id: number, data: InquiryAnswerRequest): Promise<Inquiry> {
  const res = await fetch(`${BASE_URL}/${id}/answer`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("답변 작성 실패");
  return res.json();
}

export async function fetchInquiry(id: number): Promise<Inquiry> {
  const res = await fetch(`${BASE_URL}/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("문의 조회 실패");
  return res.json();
}

export async function updateInquiry(id: number, payload: { title: string; content: string }): Promise<Inquiry> {
  const res = await fetch(`${BASE_URL}/me/${id}`, {
    method: "put",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// 문의 삭제 (본인 또는 관리자)
export async function deleteInquiry(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/me/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(res.statusText);
}
