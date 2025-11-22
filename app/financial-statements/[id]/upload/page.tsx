"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { FinancialStatement } from "@/types/financial-statement";

export default function UploadFinancialStatementPDF() {
    const router = useRouter();
    const params = useParams();
    const { isLoggedIn } = useAuth();
    const statementId = params.id as string;

    const [statement, setStatement] = useState<FinancialStatement | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoggedIn && statementId) {
            loadStatement();
        }
    }, [isLoggedIn, statementId]);

    const loadStatement = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                throw new Error("Failed to load statement");
            }
            const data = await res.json();
            setStatement(data);
        } catch {
            setError("재무제표를 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("PDF 파일을 선택해주세요!");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Upload to backend (Stage 1: PDF extraction)
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/upload?statement_id=${statementId}`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "업로드 실패");
            }

            const data = await res.json();
            alert("PDF가 성공적으로 업로드되었습니다! (Stage 1 완료)");

            // Redirect to statement detail page
            router.push(`/financial-statements/${statementId}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">PDF 업로드</h1>
                <p>로그인이 필요한 서비스입니다.</p>
                <Link href="/login" className="text-blue-500 hover:underline">
                    로그인하러 가기
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <p>로딩 중...</p>
            </div>
        );
    }

    if (error && !statement) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">PDF 업로드</h1>
                <p className="text-red-500">{error}</p>
                <Link href="/financial-statements/list" className="text-blue-500 hover:underline mt-4 block">
                    목록으로 돌아가기
                </Link>
            </div>
        );
    }

    if (!statement) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <p>재무제표를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">재무제표 PDF 업로드</h1>

            {/* Statement Info */}
            <div className="bg-gray-100 p-4 rounded mb-6">
                <h2 className="font-bold text-lg mb-2">재무제표 정보</h2>
                <p><strong>회사명:</strong> {statement.company_name}</p>
                <p><strong>유형:</strong> {statement.statement_type === "quarterly" ? "분기" : "연간"}</p>
                <p><strong>회계연도:</strong> {statement.fiscal_year}</p>
                {statement.fiscal_quarter && (
                    <p><strong>분기:</strong> {statement.fiscal_quarter}분기</p>
                )}
                <p>
                    <strong>상태:</strong>{" "}
                    <span className={`px-2 py-1 rounded text-white text-sm ${
                        statement.status === "metadata_only" ? "bg-gray-500" :
                        statement.status === "pdf_uploaded" ? "bg-blue-500" :
                        statement.status === "ratios_calculated" ? "bg-yellow-500" :
                        "bg-green-500"
                    }`}>
                        {statement.status === "metadata_only" ? "메타데이터만" :
                         statement.status === "pdf_uploaded" ? "PDF 업로드됨" :
                         statement.status === "ratios_calculated" ? "비율 계산됨" :
                         "분석 완료"}
                    </span>
                </p>
            </div>

            {/* Upload Form */}
            <div className="max-w-md">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition mb-4">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="pdf-file"
                    />
                    <label htmlFor="pdf-file" className="cursor-pointer text-gray-500">
                        {file ? (
                            <p className="font-medium text-blue-600">{file.name}</p>
                        ) : (
                            <div>
                                <p className="text-lg mb-2">📄</p>
                                <p>재무제표 PDF 파일을 선택하세요</p>
                                <p className="text-sm text-gray-400 mt-2">클릭하여 파일 선택</p>
                            </div>
                        )}
                    </label>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={uploading || !file}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                    {uploading ? "업로드 중... (Stage 1: PDF 추출)" : "업로드 및 분석 시작"}
                </button>

                {uploading && (
                    <div className="flex justify-center mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                <div className="mt-4 space-x-2">
                    <Link
                        href={`/financial-statements/${statementId}`}
                        className="text-blue-500 hover:underline"
                    >
                        상세보기
                    </Link>
                    <span className="text-gray-400">|</span>
                    <Link
                        href="/financial-statements/list"
                        className="text-blue-500 hover:underline"
                    >
                        목록으로
                    </Link>
                </div>
            </div>

            {/* Stage Info */}
            <div className="mt-8 bg-blue-50 p-4 rounded">
                <h3 className="font-bold mb-2">📊 Stage 1: PDF 추출</h3>
                <p className="text-sm text-gray-700">
                    업로드된 PDF에서 재무 데이터를 자동으로 추출합니다.
                    테이블 인식 및 OCR 기술을 사용하여 손익계산서, 재무상태표, 현금흐름표의 데이터를 파싱합니다.
                </p>
            </div>
        </div>
    );
}
