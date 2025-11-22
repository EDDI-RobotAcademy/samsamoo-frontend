"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { FinancialStatement, FinancialRatio, AnalysisReport } from "@/types/financial-statement";
import FinancialPipeline from "@/components/FinancialPipeline";

export default function FinancialStatementDetail() {
    const params = useParams();
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const statementId = params.id as string;

    const [statement, setStatement] = useState<FinancialStatement | null>(null);
    const [ratios, setRatios] = useState<FinancialRatio[]>([]);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
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
            if (!res.ok) throw new Error("Failed to load statement");

            const data = await res.json();
            setStatement(data);

            // If ratios calculated or analysis complete, load ratios and report
            if (data.status === "ratios_calculated" || data.status === "analysis_complete") {
                loadRatios();
            }
            if (data.status === "analysis_complete") {
                loadReport();
            }
        } catch {
            setError("재무제표를 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    const loadRatios = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}/ratios`,
                { credentials: "include" }
            );
            if (res.ok) {
                const data = await res.json();
                setRatios(data.ratios || []);
            }
        } catch {
            // Silently handle ratio loading errors
        }
    };

    const loadReport = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}/report`,
                { credentials: "include" }
            );
            if (res.ok) {
                const data = await res.json();
                setReport(data.report || null);
            }
        } catch {
            // Silently handle report loading errors
        }
    };

    const handleRunAnalysis = async () => {
        if (!confirm("분석을 시작하시겠습니까? (Stage 2-4 실행)")) return;

        setAnalyzing(true);
        setError("");

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/analyze/${statementId}`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "분석 실패");
            }

            alert("분석이 완료되었습니다!");
            loadStatement(); // Reload to get updated status
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
            setError(message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDownloadReport = async (format: "pdf" | "md" = "pdf") => {
        try {
            const endpoint = format === "md"
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}/report/download/md`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}/report/download`;

            const res = await fetch(endpoint, { credentials: "include" });
            if (!res.ok) throw new Error("다운로드 실패");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = format === "md"
                ? `financial_report_${statementId}.md`
                : `financial_report_${statementId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            alert("다운로드 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("정말로 이 재무제표를 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/financial-statements/${statementId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) throw new Error("삭제 실패");

            alert("재무제표가 삭제되었습니다.");
            router.push("/financial-statements/list");
        } catch {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    // Map ratio types to user-friendly names
    const getRatioDisplayName = (ratioType: string): string => {
        const nameMap: Record<string, string> = {
            'ROA': 'Return on Assets (ROA)',
            'ROE': 'Return on Equity (ROE)',
            'ROI': 'Return on Investment (ROI)',
            'DEBT_RATIO': 'Debt Ratio',
            'CURRENT_RATIO': 'Current Ratio',
            'QUICK_RATIO': 'Quick Ratio',
            'PROFIT_MARGIN': 'Profit Margin',
            'OPERATING_MARGIN': 'Operating Margin',
            'ASSET_TURNOVER': 'Asset Turnover',
            'EQUITY_MULTIPLIER': 'Equity Multiplier'
        };
        return nameMap[ratioType] || ratioType;
    };

    if (!isLoggedIn) {
        return (
            <div className="p-6 min-h-screen bg-white text-black">
                <h1 className="text-2xl font-bold mb-4">재무제표 상세</h1>
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
                <h1 className="text-2xl font-bold mb-4">재무제표 상세</h1>
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
            <h1 className="text-2xl font-bold mb-4">재무제표 상세</h1>

            {/* Statement Info */}
            <div className="bg-gray-100 p-4 rounded mb-6">
                <h2 className="font-bold text-lg mb-2">{statement.company_name}</h2>
                <p><strong>유형:</strong> {statement.statement_type === "quarterly" ? "분기" : "연간"}</p>
                <p><strong>회계연도:</strong> {statement.fiscal_year}</p>
                {statement.fiscal_quarter && (
                    <p><strong>분기:</strong> {statement.fiscal_quarter}분기</p>
                )}
                <p><strong>생성일:</strong> {new Date(statement.created_at).toLocaleString()}</p>
            </div>

            {/* Pipeline Visualizer */}
            <FinancialPipeline status={statement.status} />

            {/* Action Buttons */}
            <div className="my-6 space-x-2">
                {statement.status === "metadata_only" && (
                    <Link
                        href={`/financial-statements/${statementId}/upload`}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        PDF 업로드 (Stage 1)
                    </Link>
                )}
                {statement.status === "pdf_uploaded" && (
                    <button
                        onClick={handleRunAnalysis}
                        disabled={analyzing}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {analyzing ? "분석 중..." : "분석 실행 (Stage 2-4)"}
                    </button>
                )}
                {statement.status === "analysis_complete" && (
                    <>
                        <button
                            onClick={() => handleDownloadReport("md")}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        >
                            📄 Markdown 리포트 다운로드
                        </button>
                        <button
                            onClick={() => handleDownloadReport("pdf")}
                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                            📑 PDF 리포트 다운로드
                        </button>
                    </>
                )}
                <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    삭제
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Ratios Display */}
            {ratios.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4">📊 계산된 재무 비율</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ratios.map((ratio) => (
                            <div key={ratio.id} className="bg-gray-50 p-4 rounded border hover:shadow-md transition-shadow">
                                <p className="font-medium text-gray-700 mb-2">{getRatioDisplayName(ratio.ratio_type)}</p>
                                <p className="text-3xl font-bold text-green-600">{ratio.ratio_value}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {new Date(ratio.calculated_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Report */}
            {report && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4">📝 분석 리포트</h2>
                    <div className="bg-blue-50 p-4 rounded space-y-4">
                        {report.kpi_summary && (
                            <div>
                                <h3 className="font-semibold mb-2">KPI 요약</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{report.kpi_summary}</p>
                            </div>
                        )}

                        {report.statement_table_summary && (
                            <div>
                                <h3 className="font-semibold mb-2">재무제표 요약</h3>
                                <pre className="text-gray-700 text-sm overflow-x-auto bg-white p-3 rounded">
                                    {JSON.stringify(report.statement_table_summary, null, 2)}
                                </pre>
                            </div>
                        )}

                        {report.ratio_analysis && (
                            <div>
                                <h3 className="font-semibold mb-2">비율 분석</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{report.ratio_analysis}</p>
                            </div>
                        )}

                        {!report.kpi_summary && !report.statement_table_summary && !report.ratio_analysis && (
                            <p className="text-gray-500">분석 결과가 아직 생성되지 않았습니다.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="mt-8 space-x-2">
                <Link href="/financial-statements/list" className="text-blue-500 hover:underline">
                    목록으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
