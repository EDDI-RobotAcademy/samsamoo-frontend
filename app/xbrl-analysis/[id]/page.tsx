"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import XBRLPipeline from "@/components/XBRLPipeline";
import { XBRLRatio } from "@/types/xbrl-analysis";

interface XBRLAnalysisDetail {
    id: number;
    corp_code: string;
    corp_name: string;
    fiscal_year: number;
    report_type: string;
    source_type: string;
    status: string;
    financial_data: {
        balance_sheet?: Record<string, number>;
        income_statement?: Record<string, number>;
        cash_flow_statement?: Record<string, number>;
    };
    ratios_data: XBRLRatio[];
    executive_summary?: string;
    financial_health?: Record<string, unknown>;
    ratio_analysis?: string;
    investment_recommendation?: Record<string, unknown>;
    error_message?: string;
    has_llm_analysis: boolean;
    has_reports: boolean;
    created_at: string;
    analyzed_at?: string;
}

export default function XBRLAnalysisDetail() {
    const params = useParams();
    const router = useRouter();
    const { isLoggedIn } = useAuth();
    const analysisId = params.id as string;

    const [analysis, setAnalysis] = useState<XBRLAnalysisDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoggedIn && analysisId) {
            loadAnalysis();
        }
    }, [isLoggedIn, analysisId]);

    const loadAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/${analysisId}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Failed to load analysis");

            const data = await res.json();
            setAnalysis(data);
        } catch {
            setError("XBRL 분석을 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (format: "pdf" | "md" = "pdf") => {
        try {
            const endpoint = format === "md"
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/${analysisId}/report/download/md`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/${analysisId}/report/download`;

            const res = await fetch(endpoint, { credentials: "include" });
            if (!res.ok) throw new Error("다운로드 실패");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = format === "md"
                ? `xbrl_report_${analysisId}.md`
                : `xbrl_report_${analysisId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            alert("다운로드 중 오류가 발생했습니다.");
        }
    };

    const handleDownloadJson = () => {
        if (!analysis) return;
        const dataStr = JSON.stringify(analysis, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xbrl_analysis_${analysis.corp_name}_${analysis.fiscal_year}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleDelete = async () => {
        if (!confirm("정말로 이 XBRL 분석을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/${analysisId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) throw new Error("삭제 실패");

            alert("XBRL 분석이 삭제되었습니다.");
            router.push("/xbrl-analysis/list");
        } catch {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const formatCurrency = (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        if (Math.abs(value) >= 1e12) {
            return `${(value / 1e12).toFixed(2)}조원`;
        } else if (Math.abs(value) >= 1e8) {
            return `${(value / 1e8).toFixed(2)}억원`;
        } else if (Math.abs(value) >= 1e4) {
            return `${(value / 1e4).toFixed(2)}만원`;
        }
        return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
    };

    const getRatioCategoryLabel = (category: string): string => {
        const labels: Record<string, string> = {
            profitability: "수익성",
            liquidity: "유동성",
            leverage: "안정성",
            efficiency: "효율성",
            other: "기타",
        };
        return labels[category] || category;
    };

    const getRatioTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            roa: "총자산이익률 (ROA)",
            roe: "자기자본이익률 (ROE)",
            profit_margin: "순이익률",
            operating_margin: "영업이익률",
            gross_margin: "매출총이익률",
            current_ratio: "유동비율",
            quick_ratio: "당좌비율",
            cash_ratio: "현금비율",
            debt_ratio: "부채비율",
            equity_ratio: "자기자본비율",
            debt_to_equity: "부채자본비율",
            interest_coverage: "이자보상배율",
            asset_turnover: "총자산회전율",
            receivables_turnover: "매출채권회전율",
            inventory_turnover: "재고자산회전율",
        };
        return labels[type] || type;
    };

    const groupRatiosByCategory = (ratios: XBRLRatio[]) => {
        const grouped: Record<string, XBRLRatio[]> = {};
        ratios.forEach(ratio => {
            if (!grouped[ratio.category]) {
                grouped[ratio.category] = [];
            }
            grouped[ratio.category].push(ratio);
        });
        return grouped;
    };

    // Memoize data consistency warnings
    const dataWarnings = useMemo(() => {
        if (!analysis?.financial_data) return [];

        const warnings: string[] = [];
        const bs = analysis.financial_data.balance_sheet;
        const is = analysis.financial_data.income_statement;

        if (bs) {
            const totalAssets = bs.total_assets || 0;
            const currentAssets = bs.current_assets || 0;
            const nonCurrentAssets = bs.non_current_assets || 0;
            const totalLiabilities = bs.total_liabilities || 0;
            const totalEquity = bs.total_equity || 0;

            if (totalAssets > 0 && (currentAssets > 0 || nonCurrentAssets > 0)) {
                const sumAssets = currentAssets + nonCurrentAssets;
                if (sumAssets > 0 && Math.abs(totalAssets - sumAssets) / sumAssets > 0.1) {
                    warnings.push(`자산 합계 불일치: 총자산(${formatCurrency(totalAssets)}) vs 유동+비유동(${formatCurrency(sumAssets)})`);
                }
            }

            if (totalAssets > 0 && totalLiabilities > 0 && totalEquity > 0) {
                const expectedEquity = totalAssets - totalLiabilities;
                if (Math.abs(totalEquity - expectedEquity) / totalEquity > 0.1) {
                    warnings.push(`회계등식 불일치: 자본(${formatCurrency(totalEquity)}) vs 자산-부채(${formatCurrency(expectedEquity)})`);
                }
            }
        }

        if (is) {
            const revenue = is.revenue || 0;
            const netIncome = is.net_income || 0;

            if (revenue > 0 && netIncome > revenue) {
                warnings.push(`순이익(${formatCurrency(netIncome)})이 매출액(${formatCurrency(revenue)})보다 큽니다`);
            }
        }

        return warnings;
    }, [analysis?.financial_data]);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            pending: { label: "대기중", className: "bg-yellow-100 text-yellow-800" },
            extracting: { label: "추출중", className: "bg-blue-100 text-blue-800" },
            analyzing: { label: "분석중", className: "bg-indigo-100 text-indigo-800" },
            completed: { label: "완료", className: "bg-green-100 text-green-800" },
            failed: { label: "실패", className: "bg-red-100 text-red-800" },
        };
        const badge = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-100">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold">XBRL 분석 상세</h1>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-slate-600 mb-4">로그인이 필요한 서비스입니다.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            로그인하러 가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold">XBRL 분석 상세</h1>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">분석 데이터를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !analysis) {
        return (
            <div className="min-h-screen bg-slate-100">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold">XBRL 분석 상세</h1>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-red-600 mb-4">{error}</p>
                        <Link href="/xbrl-analysis/list" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            목록으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="min-h-screen bg-slate-100">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl font-bold">XBRL 분석 상세</h1>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-600">XBRL 분석을 찾을 수 없습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link href="/xbrl-analysis/list" className="hover:bg-white/20 p-2 rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold">{analysis.corp_name}</h1>
                                <p className="text-indigo-200 text-sm">XBRL 분석 #{analysis.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(analysis.status)}
                        </div>
                    </div>

                    {/* Quick Info Bar */}
                    <div className="flex flex-wrap gap-6 text-sm mt-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-indigo-200">회사코드:</span>
                            <span className="font-medium">{analysis.corp_code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-indigo-200">회계연도:</span>
                            <span className="font-medium">{analysis.fiscal_year}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-indigo-200">보고서:</span>
                            <span className="font-medium">
                                {analysis.report_type === "annual" ? "연간" :
                                 analysis.report_type === "semi_annual" ? "반기" : "분기"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                            <span className="text-indigo-200">소스:</span>
                            <span className="font-medium">
                                {analysis.source_type === "upload" ? "파일 업로드" : "DART API"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Action Buttons Card */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-slate-500">
                            <span>생성일: {new Date(analysis.created_at).toLocaleString()}</span>
                            {analysis.analyzed_at && (
                                <span className="ml-4">분석완료: {new Date(analysis.analyzed_at).toLocaleString()}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {analysis.has_reports && (
                                <>
                                    <button
                                        onClick={() => handleDownloadReport("md")}
                                        className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Markdown
                                    </button>
                                    <button
                                        onClick={() => handleDownloadReport("pdf")}
                                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        PDF
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleDownloadJson}
                                className="inline-flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                JSON
                            </button>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                삭제
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pipeline Visualizer */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        분석 파이프라인
                    </h3>
                    <XBRLPipeline status={analysis.status} />
                </div>

                {/* Error Message */}
                {analysis.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-medium text-red-800">분석 오류</p>
                                <p className="text-sm text-red-700 mt-1">{analysis.error_message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Warnings */}
                {dataWarnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="font-medium text-amber-800">데이터 일관성 경고</p>
                                <ul className="list-disc list-inside text-sm text-amber-700 mt-2 space-y-1">
                                    {dataWarnings.map((warning, idx) => (
                                        <li key={idx}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Data */}
                {analysis.financial_data && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            재무 데이터
                        </h3>

                        <div className="space-y-6">
                            {/* Balance Sheet */}
                            {analysis.financial_data.balance_sheet && Object.keys(analysis.financial_data.balance_sheet).length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                                        재무상태표
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        {analysis.financial_data.balance_sheet.total_assets !== undefined && (
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs text-slate-500 font-medium">총자산</span>
                                                <p className="font-bold text-slate-800 mt-1">{formatCurrency(analysis.financial_data.balance_sheet.total_assets)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.balance_sheet.total_liabilities !== undefined && (
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs text-slate-500 font-medium">총부채</span>
                                                <p className="font-bold text-slate-800 mt-1">{formatCurrency(analysis.financial_data.balance_sheet.total_liabilities)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.balance_sheet.total_equity !== undefined && (
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs text-slate-500 font-medium">자기자본</span>
                                                <p className="font-bold text-slate-800 mt-1">{formatCurrency(analysis.financial_data.balance_sheet.total_equity)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.balance_sheet.current_assets !== undefined && (
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs text-slate-500 font-medium">유동자산</span>
                                                <p className="font-bold text-slate-800 mt-1">{formatCurrency(analysis.financial_data.balance_sheet.current_assets)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.balance_sheet.current_liabilities !== undefined && (
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                                <span className="text-xs text-slate-500 font-medium">유동부채</span>
                                                <p className="font-bold text-slate-800 mt-1">{formatCurrency(analysis.financial_data.balance_sheet.current_liabilities)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Income Statement */}
                            {analysis.financial_data.income_statement && Object.keys(analysis.financial_data.income_statement).length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        손익계산서
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {analysis.financial_data.income_statement.revenue !== undefined && (
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                                <span className="text-xs text-blue-600 font-medium">매출액</span>
                                                <p className="font-bold text-blue-800 mt-1">{formatCurrency(analysis.financial_data.income_statement.revenue)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.income_statement.operating_income !== undefined && (
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                                <span className="text-xs text-blue-600 font-medium">영업이익</span>
                                                <p className="font-bold text-blue-800 mt-1">{formatCurrency(analysis.financial_data.income_statement.operating_income)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.income_statement.net_income !== undefined && (
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                                <span className="text-xs text-blue-600 font-medium">당기순이익</span>
                                                <p className="font-bold text-blue-800 mt-1">{formatCurrency(analysis.financial_data.income_statement.net_income)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cash Flow */}
                            {analysis.financial_data.cash_flow_statement && Object.keys(analysis.financial_data.cash_flow_statement).length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        현금흐름표
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {analysis.financial_data.cash_flow_statement.operating_cash_flow !== undefined && (
                                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                                                <span className="text-xs text-emerald-600 font-medium">영업현금흐름</span>
                                                <p className="font-bold text-emerald-800 mt-1">{formatCurrency(analysis.financial_data.cash_flow_statement.operating_cash_flow)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.cash_flow_statement.investing_cash_flow !== undefined && (
                                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                                                <span className="text-xs text-emerald-600 font-medium">투자현금흐름</span>
                                                <p className="font-bold text-emerald-800 mt-1">{formatCurrency(analysis.financial_data.cash_flow_statement.investing_cash_flow)}</p>
                                            </div>
                                        )}
                                        {analysis.financial_data.cash_flow_statement.financing_cash_flow !== undefined && (
                                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                                                <span className="text-xs text-emerald-600 font-medium">재무현금흐름</span>
                                                <p className="font-bold text-emerald-800 mt-1">{formatCurrency(analysis.financial_data.cash_flow_statement.financing_cash_flow)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Financial Ratios */}
                {analysis.ratios_data && analysis.ratios_data.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            재무비율
                        </h3>
                        <div className="space-y-6">
                            {Object.entries(groupRatiosByCategory(analysis.ratios_data)).map(([category, ratios]) => (
                                <div key={category}>
                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${
                                            category === 'profitability' ? 'bg-purple-500' :
                                            category === 'liquidity' ? 'bg-cyan-500' :
                                            category === 'leverage' ? 'bg-orange-500' :
                                            category === 'efficiency' ? 'bg-emerald-500' :
                                            'bg-slate-500'
                                        }`}></span>
                                        {getRatioCategoryLabel(category)}
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {ratios.map((ratio, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-xl border ${
                                                    category === 'profitability' ? 'bg-purple-50 border-purple-200' :
                                                    category === 'liquidity' ? 'bg-cyan-50 border-cyan-200' :
                                                    category === 'leverage' ? 'bg-orange-50 border-orange-200' :
                                                    category === 'efficiency' ? 'bg-emerald-50 border-emerald-200' :
                                                    'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <span className={`text-xs font-medium ${
                                                    category === 'profitability' ? 'text-purple-600' :
                                                    category === 'liquidity' ? 'text-cyan-600' :
                                                    category === 'leverage' ? 'text-orange-600' :
                                                    category === 'efficiency' ? 'text-emerald-600' :
                                                    'text-slate-600'
                                                }`}>
                                                    {getRatioTypeLabel(ratio.type)}
                                                </span>
                                                <p className={`text-xl font-bold mt-1 ${
                                                    category === 'profitability' ? 'text-purple-800' :
                                                    category === 'liquidity' ? 'text-cyan-800' :
                                                    category === 'leverage' ? 'text-orange-800' :
                                                    category === 'efficiency' ? 'text-emerald-800' :
                                                    'text-slate-800'
                                                }`}>
                                                    {ratio.formatted}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* LLM Analysis */}
                {analysis.has_llm_analysis && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI 분석 리포트
                        </h3>
                        <div className="space-y-6">
                            {analysis.executive_summary && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                                    <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        경영진 요약
                                    </h4>
                                    <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">
                                        {analysis.executive_summary}
                                    </p>
                                </div>
                            )}
                            {analysis.ratio_analysis && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        비율 분석
                                    </h4>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {analysis.ratio_analysis}
                                    </p>
                                </div>
                            )}
                            {analysis.financial_health && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                                    <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        재무건전성 평가
                                    </h4>
                                    <pre className="text-sm text-emerald-900 bg-emerald-100/50 p-4 rounded-lg overflow-x-auto font-mono">
                                        {JSON.stringify(analysis.financial_health, null, 2)}
                                    </pre>
                                </div>
                            )}
                            {analysis.investment_recommendation && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                    <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        투자 의견
                                    </h4>
                                    <pre className="text-sm text-amber-900 bg-amber-100/50 p-4 rounded-lg overflow-x-auto font-mono">
                                        {JSON.stringify(analysis.investment_recommendation, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/xbrl-analysis/list"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        목록으로 돌아가기
                    </Link>
                    <div className="flex gap-2">
                        <Link
                            href="/xbrl-analysis"
                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            빠른 분석
                        </Link>
                        <Link
                            href="/xbrl-analysis/create"
                            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            새 분석 저장
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
