"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { CreateStatementRequest } from "@/types/financial-statement";

export default function CreateFinancialStatement() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<CreateStatementRequest>({
        company_name: "",
        statement_type: "annual",
        fiscal_year: new Date().getFullYear(),
        fiscal_quarter: undefined,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.company_name.trim()) {
            alert("회사명을 입력해주세요.");
            return;
        }

        if (formData.fiscal_year < 1900 || formData.fiscal_year > 2100) {
            alert("회계연도는 1900~2100 사이여야 합니다.");
            return;
        }

        if (formData.statement_type === "quarterly") {
            if (!formData.fiscal_quarter || formData.fiscal_quarter < 1 || formData.fiscal_quarter > 4) {
                alert("분기는 1~4 사이여야 합니다.");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                company_name: formData.company_name,
                statement_type: formData.statement_type,
                fiscal_year: formData.fiscal_year,
                ...(formData.statement_type === "quarterly" && { fiscal_quarter: formData.fiscal_quarter }),
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/create`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                alert(`생성 실패: ${errData.detail || res.statusText}`);
                return;
            }

            const data = await res.json();
            alert("재무제표가 생성되었습니다!");
            // Redirect to upload page
            router.push(`/financial-statements/${data.id}/upload`);
        } catch (err) {
            console.error("Create error:", err);
            alert("생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">재무제표 생성</h1>
                <p>로그인이 필요한 서비스입니다.</p>
                <Link href="/login" className="text-blue-500 hover:underline">
                    로그인하러 가기
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">새 재무제표 생성</h1>

            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                {/* 회사명 */}
                <div>
                    <label className="block font-semibold mb-1">
                        회사명 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="예: 삼성전자"
                        required
                    />
                </div>

                {/* 유형 */}
                <div>
                    <label className="block font-semibold mb-1">
                        재무제표 유형 <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.statement_type}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                statement_type: e.target.value as "quarterly" | "annual",
                                fiscal_quarter: e.target.value === "annual" ? undefined : formData.fiscal_quarter,
                            })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="annual">연간 (Annual)</option>
                        <option value="quarterly">분기 (Quarterly)</option>
                    </select>
                </div>

                {/* 회계연도 */}
                <div>
                    <label className="block font-semibold mb-1">
                        회계연도 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.fiscal_year}
                        onChange={(e) =>
                            setFormData({ ...formData, fiscal_year: parseInt(e.target.value) })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        min={1900}
                        max={2100}
                        required
                    />
                </div>

                {/* 분기 (분기 재무제표일 때만) */}
                {formData.statement_type === "quarterly" && (
                    <div>
                        <label className="block font-semibold mb-1">
                            분기 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.fiscal_quarter || 1}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    fiscal_quarter: parseInt(e.target.value),
                                })
                            }
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                            <option value={1}>1분기 (Q1)</option>
                            <option value={2}>2분기 (Q2)</option>
                            <option value={3}>3분기 (Q3)</option>
                            <option value={4}>4분기 (Q4)</option>
                        </select>
                    </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex items-center space-x-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "생성 중..." : "생성"}
                    </button>
                    <Link
                        href="/financial-statements/list"
                        className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                    >
                        취소
                    </Link>
                </div>
            </form>
        </div>
    );
}
