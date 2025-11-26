"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { XBRLAnalysisResult, XBRLRatio } from "@/types/xbrl-analysis";

type AnalysisMode = "full" | "ratios" | "parse";

export default function XBRLAnalysisPage() {
    const [file, setFile] = useState<File | null>(null);
    const [corpName, setCorpName] = useState("");
    const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
    const [industry, setIndustry] = useState("default");
    const [includeLLM, setIncludeLLM] = useState(false);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("full");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<XBRLAnalysisResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const validExtensions = ['.html', '.xhtml', '.htm', '.xml', '.xbrl', '.zip'];
            const ext = droppedFile.name.toLowerCase().substring(droppedFile.name.lastIndexOf('.'));
            if (validExtensions.includes(ext)) {
                setFile(droppedFile);
                setError(null);
                setResult(null);
            } else {
                setError(`지원하지 않는 파일 형식입니다. 지원 형식: ${validExtensions.join(', ')}`);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setError("XBRL 파일을 선택해주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("corp_name", corpName || "Unknown");
            formData.append("fiscal_year", fiscalYear.toString());

            let endpoint = "/xbrl/upload/analyze";

            if (analysisMode === "full") {
                formData.append("industry", industry);
                formData.append("include_llm_analysis", includeLLM.toString());
                endpoint = "/xbrl/upload/analyze";
            } else if (analysisMode === "ratios") {
                endpoint = "/xbrl/upload/ratios";
            } else {
                endpoint = "/xbrl/upload/parse";
                formData.append("include_all_concepts", "true");
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "분석에 실패했습니다.");
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (value: number | undefined): string => {
        if (value === undefined || value === null) return "-";
        return new Intl.NumberFormat('ko-KR').format(value);
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
        return `${formatNumber(value)}원`;
    };

    const getRatioCategoryLabel = (category: string): string => {
        const labels: Record<string, string> = {
            profitability: "수익성 지표",
            liquidity: "유동성 지표",
            leverage: "안정성 지표",
            efficiency: "효율성 지표",
            other: "기타 지표",
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

    const dataWarnings = useMemo(() => {
        if (!result?.financial_data) return [];

        const warnings: string[] = [];
        const bs = result.financial_data.balance_sheet;
        const is = result.financial_data.income_statement;

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

            if (currentAssets > totalAssets * 1.1 && totalAssets > 0) {
                warnings.push(`유동자산(${formatCurrency(currentAssets)})이 총자산(${formatCurrency(totalAssets)})보다 큽니다`);
            }
        }

        if (is) {
            const revenue = is.revenue || 0;
            const netIncome = is.net_income || 0;
            const operatingIncome = is.operating_income || 0;

            if (revenue > 0 && netIncome > revenue) {
                warnings.push(`순이익(${formatCurrency(netIncome)})이 매출액(${formatCurrency(revenue)})보다 큽니다`);
            }

            if (revenue > 0 && operatingIncome > revenue) {
                warnings.push(`영업이익(${formatCurrency(operatingIncome)})이 매출액(${formatCurrency(revenue)})보다 큽니다`);
            }
        }

        return warnings;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result?.financial_data]);

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">XBRL 재무제표 분석</h1>
                            <p className="text-indigo-100 text-lg">
                                XBRL/iXBRL 형식의 재무제표 파일을 업로드하여 재무비율을 계산하고 AI 분석을 수행합니다.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/xbrl-analysis/list"
                                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                저장된 분석
                            </Link>
                            <Link
                                href="/xbrl-analysis/create"
                                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                새 분석 저장
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        파일 업로드 및 설정
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* File Upload */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                XBRL 파일 업로드 <span className="text-red-500">*</span>
                            </label>
                            <div
                                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                                    file
                                        ? "border-emerald-500 bg-emerald-50"
                                        : "border-slate-300 hover:border-indigo-500 hover:bg-indigo-50"
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".html,.xhtml,.htm,.xml,.xbrl,.zip"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {file ? (
                                    <div>
                                        <svg className="w-12 h-12 mx-auto mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-emerald-700 font-bold text-lg">{file.name}</p>
                                        <p className="text-slate-600 mt-1">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className="mt-3 px-4 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                        >
                                            파일 제거
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-slate-700 font-medium text-lg">
                                            클릭하거나 파일을 드래그하여 업로드
                                        </p>
                                        <p className="text-slate-500 mt-2">
                                            지원 형식: .html, .xhtml, .xml, .xbrl, .zip
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Corporation Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                회사명
                            </label>
                            <input
                                type="text"
                                value={corpName}
                                onChange={(e) => setCorpName(e.target.value)}
                                placeholder="예: 삼성전자"
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Fiscal Year */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                회계연도
                            </label>
                            <input
                                type="number"
                                value={fiscalYear}
                                onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                                min={2000}
                                max={2100}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Analysis Mode */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                분석 모드
                            </label>
                            <select
                                value={analysisMode}
                                onChange={(e) => setAnalysisMode(e.target.value as AnalysisMode)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="full">전체 분석 (재무데이터 + 비율 + LLM)</option>
                                <option value="ratios">비율 계산만</option>
                                <option value="parse">파싱 결과 (디버깅용)</option>
                            </select>
                        </div>

                        {/* Industry */}
                        {analysisMode === "full" && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    산업 분류
                                </label>
                                <select
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                >
                                    <option value="default">기본</option>
                                    <option value="manufacturing">제조업</option>
                                    <option value="technology">기술/IT</option>
                                    <option value="financial">금융</option>
                                    <option value="retail">유통/소매</option>
                                    <option value="healthcare">헬스케어</option>
                                    <option value="energy">에너지</option>
                                </select>
                            </div>
                        )}

                        {/* LLM Analysis Toggle */}
                        {analysisMode === "full" && (
                            <div className="md:col-span-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeLLM}
                                        onChange={(e) => setIncludeLLM(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                                    />
                                    <span className="text-slate-700 font-medium">
                                        AI 분석 포함 (GPT 기반 재무 분석 리포트 생성)
                                    </span>
                                </label>
                                <p className="text-sm text-slate-500 mt-2 ml-8">
                                    OpenAI 또는 Anthropic API 키가 서버에 설정되어 있어야 합니다.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="submit"
                            disabled={isLoading || !file}
                            className={`px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${
                                isLoading || !file
                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl"
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    분석 중...
                                </span>
                            ) : (
                                "분석 시작"
                            )}
                        </button>
                        <Link
                            href="/xbrl-analysis/list"
                            className="px-8 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        >
                            저장된 분석 목록
                        </Link>
                    </div>
                </form>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-8 shadow">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-bold">오류 발생</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {result && result.status === "success" && (
                    <div className="space-y-8">
                        {/* Data Consistency Warnings */}
                        {dataWarnings.length > 0 && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 px-6 py-4 rounded-lg shadow">
                                <div className="flex items-start">
                                    <svg className="w-6 h-6 mr-3 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-bold text-amber-800">데이터 일관성 경고</p>
                                        <p className="text-amber-700 mt-1">
                                            XBRL 파일에서 추출된 데이터에 일관성 문제가 있을 수 있습니다.
                                        </p>
                                        <ul className="list-disc list-inside text-amber-700 mt-2 space-y-1">
                                            {dataWarnings.map((warning, idx) => (
                                                <li key={idx}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Card */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-xl p-8 text-white">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold flex items-center">
                                    <svg className="w-8 h-8 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    {result.corp_name} - {result.fiscal_year}년 재무분석
                                </h2>
                                {/* Export Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const dataStr = JSON.stringify(result, null, 2);
                                            const blob = new Blob([dataStr], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `xbrl_analysis_${result.corp_name}_${result.fiscal_year}.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                        }}
                                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        JSON 다운로드
                                    </button>
                                    <button
                                        onClick={() => {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                printWindow.document.write(`
                                                    <html>
                                                    <head>
                                                        <title>${result.corp_name} - ${result.fiscal_year}년 재무분석</title>
                                                        <style>
                                                            body { font-family: 'Pretendard', -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                                            h1 { color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
                                                            h2 { color: #334155; margin-top: 30px; }
                                                            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                                                            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                                                            th { background: #f1f5f9; }
                                                            .metric { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0; }
                                                            .metric-label { color: #64748b; font-size: 14px; }
                                                            .metric-value { font-size: 20px; font-weight: bold; color: #1e293b; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <h1>${result.corp_name} - ${result.fiscal_year}년 재무분석 리포트</h1>
                                                        <p>분석일시: ${new Date().toLocaleString('ko-KR')}</p>

                                                        <h2>재무상태표</h2>
                                                        <table>
                                                            <tr><th>항목</th><th>금액</th></tr>
                                                            ${result.financial_data?.balance_sheet?.total_assets ? `<tr><td>총자산</td><td>${formatCurrency(result.financial_data.balance_sheet.total_assets)}</td></tr>` : ''}
                                                            ${result.financial_data?.balance_sheet?.total_liabilities ? `<tr><td>총부채</td><td>${formatCurrency(result.financial_data.balance_sheet.total_liabilities)}</td></tr>` : ''}
                                                            ${result.financial_data?.balance_sheet?.total_equity ? `<tr><td>자기자본</td><td>${formatCurrency(result.financial_data.balance_sheet.total_equity)}</td></tr>` : ''}
                                                        </table>

                                                        <h2>손익계산서</h2>
                                                        <table>
                                                            <tr><th>항목</th><th>금액</th></tr>
                                                            ${result.financial_data?.income_statement?.revenue ? `<tr><td>매출액</td><td>${formatCurrency(result.financial_data.income_statement.revenue)}</td></tr>` : ''}
                                                            ${result.financial_data?.income_statement?.operating_income ? `<tr><td>영업이익</td><td>${formatCurrency(result.financial_data.income_statement.operating_income)}</td></tr>` : ''}
                                                            ${result.financial_data?.income_statement?.net_income ? `<tr><td>당기순이익</td><td>${formatCurrency(result.financial_data.income_statement.net_income)}</td></tr>` : ''}
                                                        </table>

                                                        <h2>재무비율</h2>
                                                        <table>
                                                            <tr><th>지표</th><th>값</th></tr>
                                                            ${result.ratios?.map(r => `<tr><td>${r.type}</td><td>${r.formatted}</td></tr>`).join('') || ''}
                                                        </table>

                                                        ${result.analysis?.executive_summary ? `
                                                        <h2>AI 분석 요약</h2>
                                                        <p>${result.analysis.executive_summary}</p>
                                                        ` : ''}
                                                    </body>
                                                    </html>
                                                `);
                                                printWindow.document.close();
                                                printWindow.print();
                                            }
                                        }}
                                        className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        인쇄/PDF
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="bg-slate-600/50 rounded-lg p-4">
                                    <span className="text-slate-300 text-sm">파일명</span>
                                    <p className="font-bold text-lg mt-1">{result.filename || "-"}</p>
                                </div>
                                <div className="bg-slate-600/50 rounded-lg p-4">
                                    <span className="text-slate-300 text-sm">소스</span>
                                    <p className="font-bold text-lg mt-1">{result.source === "upload" ? "업로드" : "DART"}</p>
                                </div>
                                <div className="bg-slate-600/50 rounded-lg p-4">
                                    <span className="text-slate-300 text-sm">추출된 팩트</span>
                                    <p className="font-bold text-lg mt-1 text-indigo-400">{formatNumber(result.metadata?.fact_count)}</p>
                                </div>
                                <div className="bg-slate-600/50 rounded-lg p-4">
                                    <span className="text-slate-300 text-sm">컨텍스트</span>
                                    <p className="font-bold text-lg mt-1 text-indigo-400">{formatNumber(result.metadata?.context_count)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Data */}
                        {result.financial_data && (
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    재무 데이터
                                </h3>

                                {/* Balance Sheet */}
                                {result.financial_data.balance_sheet && Object.keys(result.financial_data.balance_sheet).length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="font-bold text-slate-700 mb-4 text-lg border-b-2 border-indigo-500 pb-2 inline-block">
                                            재무상태표
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {result.financial_data.balance_sheet.total_assets !== undefined && (
                                                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                                                    <span className="text-indigo-600 font-medium text-sm">총자산</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.balance_sheet.total_assets)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.balance_sheet.total_liabilities !== undefined && (
                                                <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
                                                    <span className="text-rose-600 font-medium text-sm">총부채</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.balance_sheet.total_liabilities)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.balance_sheet.total_equity !== undefined && (
                                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                                    <span className="text-emerald-600 font-medium text-sm">자기자본</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.balance_sheet.total_equity)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.balance_sheet.current_assets !== undefined && (
                                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                                    <span className="text-slate-600 font-medium text-sm">유동자산</span>
                                                    <p className="font-bold text-lg text-slate-800 mt-1">{formatCurrency(result.financial_data.balance_sheet.current_assets)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.balance_sheet.current_liabilities !== undefined && (
                                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                                    <span className="text-slate-600 font-medium text-sm">유동부채</span>
                                                    <p className="font-bold text-lg text-slate-800 mt-1">{formatCurrency(result.financial_data.balance_sheet.current_liabilities)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Income Statement */}
                                {result.financial_data.income_statement && Object.keys(result.financial_data.income_statement).length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="font-bold text-slate-700 mb-4 text-lg border-b-2 border-blue-500 pb-2 inline-block">
                                            손익계산서
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {result.financial_data.income_statement.revenue !== undefined && (
                                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                                    <span className="text-blue-600 font-medium text-sm">매출액</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.income_statement.revenue)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.income_statement.operating_income !== undefined && (
                                                <div className="bg-violet-50 border border-violet-200 p-4 rounded-lg">
                                                    <span className="text-violet-600 font-medium text-sm">영업이익</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.income_statement.operating_income)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.income_statement.net_income !== undefined && (
                                                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                                    <span className="text-green-600 font-medium text-sm">당기순이익</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.income_statement.net_income)}</p>
                                                </div>
                                            )}
                                            {result.financial_data.income_statement.gross_profit !== undefined && (
                                                <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg">
                                                    <span className="text-teal-600 font-medium text-sm">매출총이익</span>
                                                    <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(result.financial_data.income_statement.gross_profit)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Cash Flow */}
                                {(() => {
                                    const cashFlow = result.financial_data.cash_flow || result.financial_data.cash_flow_statement;
                                    if (!cashFlow || Object.keys(cashFlow).length === 0) return null;
                                    return (
                                        <div>
                                            <h4 className="font-bold text-slate-700 mb-4 text-lg border-b-2 border-emerald-500 pb-2 inline-block">
                                                현금흐름표
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {cashFlow.operating_cash_flow !== undefined && (
                                                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                                        <span className="text-emerald-600 font-medium text-sm">영업현금흐름</span>
                                                        <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(cashFlow.operating_cash_flow)}</p>
                                                    </div>
                                                )}
                                                {cashFlow.investing_cash_flow !== undefined && (
                                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                                        <span className="text-amber-600 font-medium text-sm">투자현금흐름</span>
                                                        <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(cashFlow.investing_cash_flow)}</p>
                                                    </div>
                                                )}
                                                {cashFlow.financing_cash_flow !== undefined && (
                                                    <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
                                                        <span className="text-cyan-600 font-medium text-sm">재무현금흐름</span>
                                                        <p className="font-bold text-xl text-slate-800 mt-1">{formatCurrency(cashFlow.financing_cash_flow)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Financial Ratios */}
                        {result.ratios && result.ratios.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    재무비율 분석
                                </h3>
                                <div className="space-y-6">
                                    {Object.entries(groupRatiosByCategory(result.ratios)).map(([category, ratios]) => (
                                        <div key={category}>
                                            <h4 className={`font-bold mb-4 text-lg pb-2 border-b-2 inline-block ${
                                                category === 'profitability' ? 'text-purple-700 border-purple-500' :
                                                category === 'liquidity' ? 'text-cyan-700 border-cyan-500' :
                                                category === 'leverage' ? 'text-orange-700 border-orange-500' :
                                                category === 'efficiency' ? 'text-emerald-700 border-emerald-500' :
                                                'text-slate-700 border-slate-500'
                                            }`}>
                                                {getRatioCategoryLabel(category)}
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {ratios.map((ratio, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-4 rounded-lg border-2 ${
                                                            category === 'profitability' ? 'bg-purple-50 border-purple-300' :
                                                            category === 'liquidity' ? 'bg-cyan-50 border-cyan-300' :
                                                            category === 'leverage' ? 'bg-orange-50 border-orange-300' :
                                                            category === 'efficiency' ? 'bg-emerald-50 border-emerald-300' :
                                                            'bg-slate-50 border-slate-300'
                                                        }`}
                                                    >
                                                        <span className={`text-sm font-medium ${
                                                            category === 'profitability' ? 'text-purple-700' :
                                                            category === 'liquidity' ? 'text-cyan-700' :
                                                            category === 'leverage' ? 'text-orange-700' :
                                                            category === 'efficiency' ? 'text-emerald-700' :
                                                            'text-slate-700'
                                                        }`}>
                                                            {getRatioTypeLabel(ratio.type)}
                                                        </span>
                                                        <p className="text-2xl font-bold text-slate-800 mt-2">
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
                        {result.analysis && (
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    AI 분석 리포트
                                </h3>
                                <div className="space-y-8">
                                    {/* Executive Summary */}
                                    {result.analysis.executive_summary && (
                                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                                            <h4 className="font-bold text-indigo-800 mb-3 text-lg">경영진 요약</h4>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {result.analysis.executive_summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Financial Health Assessment */}
                                    {result.analysis.financial_health && (
                                        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                                            <h4 className="font-bold text-slate-800 mb-4 text-lg">재무건전성 평가</h4>

                                            {/* Score and Rating */}
                                            <div className="flex items-center gap-8 mb-6">
                                                <div className="text-center bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                                                    <div className="text-4xl font-bold text-indigo-600">
                                                        {result.analysis.financial_health.overall_score}
                                                    </div>
                                                    <div className="text-sm text-slate-600 font-medium mt-1">종합점수</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className={`text-3xl font-bold px-6 py-3 rounded-xl shadow-sm ${
                                                        result.analysis.financial_health.rating?.startsWith('A') ? 'bg-emerald-500 text-white' :
                                                        result.analysis.financial_health.rating?.startsWith('B') ? 'bg-amber-500 text-white' :
                                                        'bg-rose-500 text-white'
                                                    }`}>
                                                        {result.analysis.financial_health.rating}
                                                    </div>
                                                    <div className="text-sm text-slate-600 font-medium mt-2">신용등급</div>
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            {result.analysis.financial_health.summary && (
                                                <p className="text-slate-700 mb-6 bg-white p-4 rounded-lg border border-slate-200">
                                                    {result.analysis.financial_health.summary}
                                                </p>
                                            )}

                                            {/* Strengths & Weaknesses */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {result.analysis.financial_health.strengths?.length > 0 && (
                                                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                                        <h5 className="font-bold text-emerald-800 mb-3 flex items-center">
                                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            강점
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {result.analysis.financial_health.strengths.map((s, i) => (
                                                                <li key={i} className="text-slate-700 flex items-start">
                                                                    <span className="text-emerald-500 mr-2">•</span>
                                                                    {s}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {result.analysis.financial_health.weaknesses?.length > 0 && (
                                                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                                                        <h5 className="font-bold text-rose-800 mb-3 flex items-center">
                                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                            </svg>
                                                            약점
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {result.analysis.financial_health.weaknesses.map((w, i) => (
                                                                <li key={i} className="text-slate-700 flex items-start">
                                                                    <span className="text-rose-500 mr-2">•</span>
                                                                    {w}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Risks & Improvements */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                {result.analysis.financial_health.key_risks?.length > 0 && (
                                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                                        <h5 className="font-bold text-amber-800 mb-3 flex items-center">
                                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            주요 리스크
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {result.analysis.financial_health.key_risks.map((r, i) => (
                                                                <li key={i} className="text-slate-700 flex items-start">
                                                                    <span className="text-amber-500 mr-2">•</span>
                                                                    {r}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {result.analysis.financial_health.improvement_areas?.length > 0 && (
                                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                        <h5 className="font-bold text-blue-800 mb-3 flex items-center">
                                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            개선 영역
                                                        </h5>
                                                        <ul className="space-y-2">
                                                            {result.analysis.financial_health.improvement_areas.map((a, i) => (
                                                                <li key={i} className="text-slate-700 flex items-start">
                                                                    <span className="text-blue-500 mr-2">•</span>
                                                                    {a}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ratio Analysis */}
                                    {result.analysis.ratio_analysis && (
                                        <div className="bg-violet-50 rounded-lg p-6 border border-violet-200">
                                            <h4 className="font-bold text-violet-800 mb-3 text-lg">비율 분석</h4>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {result.analysis.ratio_analysis}
                                            </p>
                                        </div>
                                    )}

                                    {/* Investment Recommendation */}
                                    {result.analysis.investment_recommendation && (
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                                            <h4 className="font-bold text-blue-800 mb-4 text-lg">투자 의견</h4>

                                            {/* Recommendation Badge */}
                                            <div className="flex items-center gap-6 mb-6">
                                                <div className={`text-2xl font-bold px-6 py-3 rounded-xl shadow-lg ${
                                                    result.analysis.investment_recommendation.recommendation === '매수' ? 'bg-emerald-600 text-white' :
                                                    result.analysis.investment_recommendation.recommendation === '보유' ? 'bg-amber-500 text-white' :
                                                    'bg-rose-600 text-white'
                                                }`}>
                                                    {result.analysis.investment_recommendation.recommendation}
                                                </div>
                                                <div className="text-slate-700 space-y-1">
                                                    <div>신뢰도: <span className="font-bold text-slate-800">{result.analysis.investment_recommendation.confidence}</span></div>
                                                    <div>투자자 유형: <span className="font-bold text-slate-800">{result.analysis.investment_recommendation.target_investor}</span></div>
                                                    <div>투자 기간: <span className="font-bold text-slate-800">{result.analysis.investment_recommendation.time_horizon}</span></div>
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            {result.analysis.investment_recommendation.summary && (
                                                <p className="text-slate-700 mb-6 bg-white p-4 rounded-lg border border-blue-200">
                                                    {result.analysis.investment_recommendation.summary}
                                                </p>
                                            )}

                                            {/* Positives & Negatives */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {result.analysis.investment_recommendation.key_positives?.length > 0 && (
                                                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                                        <h5 className="font-bold text-emerald-800 mb-3">긍정적 요인</h5>
                                                        <ul className="space-y-2">
                                                            {result.analysis.investment_recommendation.key_positives.map((p, i) => (
                                                                <li key={i} className="text-slate-700 flex items-start">
                                                                    <span className="text-emerald-500 mr-2">+</span>
                                                                    {p}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {result.analysis.investment_recommendation.key_negatives?.length > 0 && (
                                                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                                                        <h5 className="font-bold text-rose-800 mb-3">부정적 요인</h5>
                                                        <ul className="space-y-2">
                                                            {result.analysis.investment_recommendation.key_negatives.map((n, i) => (
                                                                <li key={i} className="text-slate-700 flex items-start">
                                                                    <span className="text-rose-500 mr-2">-</span>
                                                                    {n}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Catalysts */}
                                            {result.analysis.investment_recommendation.catalysts?.length > 0 && (
                                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-6">
                                                    <h5 className="font-bold text-purple-800 mb-3">주요 모멘텀</h5>
                                                    <ul className="space-y-2">
                                                        {result.analysis.investment_recommendation.catalysts.map((c, i) => (
                                                            <li key={i} className="text-slate-700 flex items-start">
                                                                <span className="text-purple-500 mr-2">★</span>
                                                                {c}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Legacy recommendations field */}
                                    {result.analysis.recommendations && typeof result.analysis.recommendations === 'string' && (
                                        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                            <h4 className="font-bold text-blue-800 mb-3 text-lg">투자 의견</h4>
                                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                                {result.analysis.recommendations}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Analysis Error */}
                        {result.analysis_error && (
                            <div className="bg-amber-50 border-l-4 border-amber-500 px-6 py-4 rounded-lg shadow">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 mr-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-bold text-amber-800">LLM 분석 오류</p>
                                        <p className="text-amber-700">{result.analysis_error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Validation Warnings */}
                        {result.validation && (result.validation.warnings.length > 0 || result.validation.errors.length > 0) && (
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    검증 결과
                                </h3>
                                {result.validation.errors.length > 0 && (
                                    <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
                                        <h4 className="font-bold text-red-800 mb-3">오류</h4>
                                        <ul className="space-y-2">
                                            {result.validation.errors.map((err, idx) => (
                                                <li key={idx} className="text-red-700 flex items-start">
                                                    <span className="text-red-500 mr-2">✕</span>
                                                    {err}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {result.validation.warnings.length > 0 && (
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                        <h4 className="font-bold text-amber-800 mb-3">경고</h4>
                                        <ul className="space-y-2">
                                            {result.validation.warnings.map((warn, idx) => (
                                                <li key={idx} className="text-amber-700 flex items-start">
                                                    <span className="text-amber-500 mr-2">⚠</span>
                                                    {warn}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
