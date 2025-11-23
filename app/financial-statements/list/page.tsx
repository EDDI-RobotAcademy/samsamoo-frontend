"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FinancialStatement, PaginatedStatements } from "@/types/financial-statement";

export default function FinancialStatementList() {
    const { isLoggedIn } = useAuth();
    const [statements, setStatements] = useState<FinancialStatement[]>([]);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadStatements = async (page: number) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/list?page=${page}&size=${size}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                console.error("Failed to fetch financial statements", res.status);
                setStatements([]);
                setTotal(0);
                return;
            }
            const data: PaginatedStatements = await res.json();
            console.log("Fetched financial statements:", data);
            setStatements(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error("Error loading financial statements:", err);
            setStatements([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadStatements(page);
        }
    }, [page, isLoggedIn]);

    const handleDelete = async (statementId: number) => {
        if (!confirm("정말로 이 재무제표를 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) {
                alert("삭제 실패: " + res.statusText);
                return;
            }
            alert("재무제표가 삭제되었습니다.");
            loadStatements(page);
        } catch (err) {
            console.error("Delete error:", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            metadata_only: "bg-gray-500",
            pdf_uploaded: "bg-blue-500",
            ratios_calculated: "bg-yellow-500",
            analysis_complete: "bg-green-500",
        };
        const labels = {
            metadata_only: "메타데이터만",
            pdf_uploaded: "PDF 업로드됨",
            ratios_calculated: "비율 계산됨",
            analysis_complete: "분석 완료",
        };
        return (
            <span className={`px-2 py-1 rounded text-white text-xs ${badges[status as keyof typeof badges] || "bg-gray-500"}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    const totalPages = Math.ceil(total / size);

    if (!isLoggedIn) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">재무제표 분석</h1>
                <p>로그인이 필요한 서비스입니다.</p>
                <Link href="/login" className="text-blue-500 hover:underline">
                    로그인하러 가기
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">재무제표 분석</h1>

            <Link
                href="/financial-statements/create"
                className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
            >
                새 재무제표 생성
            </Link>

            {loading ? (
                <p className="mt-4">로딩 중...</p>
            ) : statements.length === 0 ? (
                <p className="mt-4">등록된 재무제표가 없습니다.</p>
            ) : (
                <table className="w-full mt-4 border border-gray-300 text-left">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border-b">ID</th>
                        <th className="p-2 border-b">회사명</th>
                        <th className="p-2 border-b">유형</th>
                        <th className="p-2 border-b">회계연도</th>
                        <th className="p-2 border-b">분기</th>
                        <th className="p-2 border-b">상태</th>
                        <th className="p-2 border-b">생성일</th>
                        <th className="p-2 border-b">액션</th>
                    </tr>
                    </thead>
                    <tbody>
                    {statements.map((stmt) => (
                        <tr key={stmt.id} className="hover:bg-gray-50">
                            <td className="p-2 border-b">{stmt.id}</td>
                            <td className="p-2 border-b">
                                <Link
                                    href={`/financial-statements/${stmt.id}`}
                                    className="text-blue-500 hover:underline"
                                >
                                    {stmt.company_name}
                                </Link>
                            </td>
                            <td className="p-2 border-b">
                                {stmt.statement_type === "quarterly" ? "분기" : "연간"}
                            </td>
                            <td className="p-2 border-b">{stmt.fiscal_year}</td>
                            <td className="p-2 border-b">
                                {stmt.fiscal_quarter || "-"}
                            </td>
                            <td className="p-2 border-b">
                                {getStatusBadge(stmt.status)}
                            </td>
                            <td className="p-2 border-b">
                                {new Date(stmt.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-2 border-b">
                                <button
                                    onClick={() => handleDelete(stmt.id)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        이전
                    </button>
                    <span>
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}
