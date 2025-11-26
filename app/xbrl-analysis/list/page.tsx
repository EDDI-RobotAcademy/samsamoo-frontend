"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface XBRLAnalysisItem {
    id: number;
    corp_code: string;
    corp_name: string;
    fiscal_year: number;
    report_type: string;
    status: string;
    has_llm_analysis: boolean;
    has_reports: boolean;
    created_at: string;
    analyzed_at?: string;
    // LLM analysis summary fields
    executive_summary?: string;
    financial_health_rating?: string;
    investment_recommendation?: string;
}

interface PaginatedAnalyses {
    analyses: XBRLAnalysisItem[];
    total: number;
    page: number;
    size: number;
}

export default function XBRLAnalysisList() {
    const { isLoggedIn } = useAuth();
    const [analyses, setAnalyses] = useState<XBRLAnalysisItem[]>([]);
    const [page, setPage] = useState(1);
    const size = 10;
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const loadAnalyses = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/list?page=${pageNum}&size=${size}`,
                { credentials: "include" }
            );
            if (!res.ok) {
                setAnalyses([]);
                setTotal(0);
                return;
            }
            const data: PaginatedAnalyses = await res.json();
            setAnalyses(data.analyses);
            setTotal(data.total);
        } catch {
            setAnalyses([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadAnalyses(page);
        }
    }, [page, isLoggedIn]);

    const handleDelete = async (analysisId: number) => {
        if (!confirm("정말로 이 XBRL 분석을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/${analysisId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!res.ok) {
                alert("삭제 실패: " + res.statusText);
                return;
            }
            alert("XBRL 분석이 삭제되었습니다.");
            loadAnalyses(page);
        } catch {
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            pending: "bg-slate-500",
            extracting: "bg-blue-500",
            calculating: "bg-indigo-500",
            analyzing: "bg-amber-500",
            generating: "bg-violet-500",
            completed: "bg-emerald-500",
            failed: "bg-rose-500",
        };
        const labels: Record<string, string> = {
            pending: "대기중",
            extracting: "파싱중",
            calculating: "계산중",
            analyzing: "분석중",
            generating: "생성중",
            completed: "완료",
            failed: "실패",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${badges[status] || "bg-slate-500"}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getReportTypeBadge = (reportType: string) => {
        const styles: Record<string, string> = {
            annual: "bg-indigo-100 text-indigo-700 border-indigo-200",
            semi_annual: "bg-blue-100 text-blue-700 border-blue-200",
            quarterly: "bg-teal-100 text-teal-700 border-teal-200",
        };
        const labels: Record<string, string> = {
            annual: "연간",
            semi_annual: "반기",
            quarterly: "분기",
        };
        return (
            <span className={`px-2 py-1 rounded border text-xs font-medium ${styles[reportType] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {labels[reportType] || reportType}
            </span>
        );
    };

    const getHealthRatingBadge = (rating?: string) => {
        if (!rating) return null;
        const styles: Record<string, string> = {
            "우수": "bg-emerald-100 text-emerald-700 border-emerald-300",
            "양호": "bg-blue-100 text-blue-700 border-blue-300",
            "보통": "bg-amber-100 text-amber-700 border-amber-300",
            "주의": "bg-orange-100 text-orange-700 border-orange-300",
            "위험": "bg-rose-100 text-rose-700 border-rose-300",
        };
        return (
            <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${styles[rating] || "bg-slate-100 text-slate-700 border-slate-300"}`}>
                {rating}
            </span>
        );
    };

    const getInvestmentBadge = (recommendation?: string) => {
        if (!recommendation) return null;
        const styles: Record<string, string> = {
            "매수": "bg-emerald-500 text-white",
            "적극 매수": "bg-emerald-600 text-white",
            "보유": "bg-blue-500 text-white",
            "관망": "bg-amber-500 text-white",
            "매도": "bg-rose-500 text-white",
            "적극 매도": "bg-rose-600 text-white",
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[recommendation] || "bg-slate-500 text-white"}`}>
                {recommendation}
            </span>
        );
    };

    const totalPages = Math.ceil(total / size);

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-100">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold">XBRL 분석 목록</h1>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto p-6">
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-slate-700 text-lg mb-4">로그인이 필요한 서비스입니다.</p>
                        <Link href="/login" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                            로그인하러 가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">XBRL 분석 목록</h1>
                            <p className="text-indigo-100">
                                저장된 XBRL 재무제표 분석 결과를 관리합니다. 총 {total}개의 분석 결과가 있습니다.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/xbrl-analysis/create"
                                className="bg-white text-indigo-700 px-5 py-2 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                새 XBRL 분석
                            </Link>
                            <Link
                                href="/xbrl-analysis"
                                className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                빠른 분석
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                {loading ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200 text-center">
                        <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-slate-600 text-lg">로딩 중...</p>
                    </div>
                ) : analyses.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-slate-700 text-lg mb-2">등록된 XBRL 분석이 없습니다.</p>
                        <p className="text-slate-500 mb-6">새 XBRL 분석을 생성하여 시작하세요.</p>
                        <Link
                            href="/xbrl-analysis/create"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            첫 XBRL 분석 시작하기
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                            >
                                {/* Main Row */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Expand Button */}
                                            {analysis.has_llm_analysis && (
                                                <button
                                                    onClick={() => toggleExpand(analysis.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title={expandedRows.has(analysis.id) ? "접기" : "AI 분석 보기"}
                                                >
                                                    <svg
                                                        className={`w-5 h-5 text-indigo-600 transition-transform ${expandedRows.has(analysis.id) ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                            {!analysis.has_llm_analysis && (
                                                <div className="w-9" /> // Spacer
                                            )}

                                            {/* ID */}
                                            <span className="text-slate-500 font-mono text-sm w-12">#{analysis.id}</span>

                                            {/* Company Name */}
                                            <Link
                                                href={`/xbrl-analysis/${analysis.id}`}
                                                className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                                            >
                                                {analysis.corp_name}
                                            </Link>

                                            {/* Fiscal Year */}
                                            <span className="text-slate-700 font-medium">{analysis.fiscal_year}</span>

                                            {/* Report Type */}
                                            {getReportTypeBadge(analysis.report_type)}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Health Rating Badge */}
                                            {analysis.financial_health_rating && getHealthRatingBadge(analysis.financial_health_rating)}

                                            {/* Investment Recommendation Badge */}
                                            {analysis.investment_recommendation && getInvestmentBadge(analysis.investment_recommendation)}

                                            {/* Status Badge */}
                                            {getStatusBadge(analysis.status)}

                                            {/* AI Analysis Indicator */}
                                            {analysis.has_llm_analysis ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
                                                    </svg>
                                                    AI
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                    AI
                                                </span>
                                            )}

                                            {/* Reports Indicator */}
                                            {analysis.has_reports ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    리포트
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                    </svg>
                                                    리포트
                                                </span>
                                            )}

                                            {/* Date */}
                                            <span className="text-slate-500 text-sm">
                                                {new Date(analysis.created_at).toLocaleDateString('ko-KR')}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/xbrl-analysis/${analysis.id}`}
                                                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    상세
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(analysis.id)}
                                                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded LLM Analysis Preview */}
                                {expandedRows.has(analysis.id) && analysis.has_llm_analysis && (
                                    <div className="border-t border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Executive Summary */}
                                            {analysis.executive_summary && (
                                                <div className="md:col-span-2">
                                                    <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        경영진 요약
                                                    </h4>
                                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/60 p-4 rounded-lg border border-indigo-100">
                                                        {analysis.executive_summary}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Quick Stats */}
                                            <div className="space-y-4">
                                                {analysis.financial_health_rating && (
                                                    <div className="bg-white/60 p-4 rounded-lg border border-indigo-100">
                                                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">재무건전성</h5>
                                                        <div className="flex items-center gap-2">
                                                            {getHealthRatingBadge(analysis.financial_health_rating)}
                                                            <span className="text-lg font-bold text-slate-800">{analysis.financial_health_rating}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {analysis.investment_recommendation && (
                                                    <div className="bg-white/60 p-4 rounded-lg border border-indigo-100">
                                                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">투자의견</h5>
                                                        <div className="flex items-center gap-2">
                                                            {getInvestmentBadge(analysis.investment_recommendation)}
                                                            <span className="text-lg font-bold text-slate-800">{analysis.investment_recommendation}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <Link
                                                    href={`/xbrl-analysis/${analysis.id}`}
                                                    className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
                                                >
                                                    전체 분석 보기 →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center space-x-4">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            이전
                        </button>
                        <span className="text-slate-700 font-medium">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                        >
                            다음
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
