"use client";

import { useState, useRef } from "react";
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
        // Assuming values are in KRW (원)
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

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">XBRL 재무제표 분석</h1>
                <p className="text-gray-600">
                    XBRL/iXBRL 형식의 재무제표 파일을 업로드하여 재무비율을 계산하고 분석합니다.
                </p>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* File Upload */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            XBRL 파일 업로드 <span className="text-red-500">*</span>
                        </label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                file ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-blue-500"
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
                                    <p className="text-green-600 font-medium">{file.name}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="mt-2 text-sm text-red-500 hover:underline"
                                    >
                                        파일 제거
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600">
                                        클릭하거나 파일을 드래그하여 업로드
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        지원 형식: .html, .xhtml, .xml, .xbrl, .zip
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Corporation Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            회사명
                        </label>
                        <input
                            type="text"
                            value={corpName}
                            onChange={(e) => setCorpName(e.target.value)}
                            placeholder="예: 삼성전자"
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Fiscal Year */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            회계연도
                        </label>
                        <input
                            type="number"
                            value={fiscalYear}
                            onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                            min={2000}
                            max={2100}
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Analysis Mode */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            분석 모드
                        </label>
                        <select
                            value={analysisMode}
                            onChange={(e) => setAnalysisMode(e.target.value as AnalysisMode)}
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="full">전체 분석 (재무데이터 + 비율 + LLM)</option>
                            <option value="ratios">비율 계산만</option>
                            <option value="parse">파싱 결과 (디버깅용)</option>
                        </select>
                    </div>

                    {/* Industry (only for full analysis) */}
                    {analysisMode === "full" && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                산업 분류
                            </label>
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeLLM}
                                    onChange={(e) => setIncludeLLM(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 mr-2"
                                />
                                <span className="text-sm">
                                    LLM 분석 포함 (AI 기반 재무 분석 리포트 생성)
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                OpenAI 또는 Anthropic API 키가 설정되어 있어야 합니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex gap-4">
                    <button
                        type="submit"
                        disabled={isLoading || !file}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            isLoading || !file
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                        href="/financial-statements/list"
                        className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        목록으로
                    </Link>
                </div>
            </form>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <p className="font-medium">오류 발생</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Results Display */}
            {result && result.status === "success" && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {result.corp_name} - {result.fiscal_year}년 재무분석
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">파일명</span>
                                <p className="font-medium">{result.filename || "-"}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">소스</span>
                                <p className="font-medium">{result.source === "upload" ? "업로드" : "DART"}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">추출된 팩트</span>
                                <p className="font-medium">{formatNumber(result.metadata?.fact_count)}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">컨텍스트</span>
                                <p className="font-medium">{formatNumber(result.metadata?.context_count)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Data */}
                    {result.financial_data && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold mb-4">재무 데이터</h3>

                            {/* Balance Sheet */}
                            {result.financial_data.balance_sheet && Object.keys(result.financial_data.balance_sheet).length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-700 mb-2">재무상태표</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        {result.financial_data.balance_sheet.total_assets !== undefined && (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <span className="text-gray-500">총자산</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.balance_sheet.total_assets)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.balance_sheet.total_liabilities !== undefined && (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <span className="text-gray-500">총부채</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.balance_sheet.total_liabilities)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.balance_sheet.total_equity !== undefined && (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <span className="text-gray-500">자기자본</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.balance_sheet.total_equity)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.balance_sheet.current_assets !== undefined && (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <span className="text-gray-500">유동자산</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.balance_sheet.current_assets)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.balance_sheet.current_liabilities !== undefined && (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <span className="text-gray-500">유동부채</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.balance_sheet.current_liabilities)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Income Statement */}
                            {result.financial_data.income_statement && Object.keys(result.financial_data.income_statement).length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-700 mb-2">손익계산서</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        {result.financial_data.income_statement.revenue !== undefined && (
                                            <div className="bg-blue-50 p-3 rounded">
                                                <span className="text-gray-500">매출액</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.income_statement.revenue)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.income_statement.operating_income !== undefined && (
                                            <div className="bg-blue-50 p-3 rounded">
                                                <span className="text-gray-500">영업이익</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.income_statement.operating_income)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.income_statement.net_income !== undefined && (
                                            <div className="bg-blue-50 p-3 rounded">
                                                <span className="text-gray-500">당기순이익</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.income_statement.net_income)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.income_statement.gross_profit !== undefined && (
                                            <div className="bg-blue-50 p-3 rounded">
                                                <span className="text-gray-500">매출총이익</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.income_statement.gross_profit)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cash Flow */}
                            {result.financial_data.cash_flow && Object.keys(result.financial_data.cash_flow).length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">현금흐름표</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        {result.financial_data.cash_flow.operating_cash_flow !== undefined && (
                                            <div className="bg-green-50 p-3 rounded">
                                                <span className="text-gray-500">영업현금흐름</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.cash_flow.operating_cash_flow)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.cash_flow.investing_cash_flow !== undefined && (
                                            <div className="bg-green-50 p-3 rounded">
                                                <span className="text-gray-500">투자현금흐름</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.cash_flow.investing_cash_flow)}</p>
                                            </div>
                                        )}
                                        {result.financial_data.cash_flow.financing_cash_flow !== undefined && (
                                            <div className="bg-green-50 p-3 rounded">
                                                <span className="text-gray-500">재무현금흐름</span>
                                                <p className="font-medium">{formatCurrency(result.financial_data.cash_flow.financing_cash_flow)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Financial Ratios */}
                    {result.ratios && result.ratios.length > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold mb-4">재무비율</h3>
                            <div className="space-y-4">
                                {Object.entries(groupRatiosByCategory(result.ratios)).map(([category, ratios]) => (
                                    <div key={category}>
                                        <h4 className="font-medium text-gray-700 mb-2">
                                            {getRatioCategoryLabel(category)}
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {ratios.map((ratio, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded border ${
                                                        category === 'profitability' ? 'bg-purple-50 border-purple-200' :
                                                        category === 'liquidity' ? 'bg-cyan-50 border-cyan-200' :
                                                        category === 'leverage' ? 'bg-orange-50 border-orange-200' :
                                                        category === 'efficiency' ? 'bg-emerald-50 border-emerald-200' :
                                                        'bg-gray-50 border-gray-200'
                                                    }`}
                                                >
                                                    <span className="text-xs text-gray-500">
                                                        {getRatioTypeLabel(ratio.type)}
                                                    </span>
                                                    <p className="text-lg font-bold mt-1">
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
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold mb-4">AI 분석 리포트</h3>
                            <div className="space-y-4">
                                {result.analysis.executive_summary && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">경영진 요약</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {result.analysis.executive_summary}
                                        </p>
                                    </div>
                                )}
                                {result.analysis.financial_health && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">재무건전성 평가</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {result.analysis.financial_health}
                                        </p>
                                    </div>
                                )}
                                {result.analysis.ratio_analysis && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">비율 분석</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {result.analysis.ratio_analysis}
                                        </p>
                                    </div>
                                )}
                                {result.analysis.recommendations && (
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">투자 의견</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                            {result.analysis.recommendations}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analysis Error */}
                    {result.analysis_error && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                            <p className="font-medium">LLM 분석 오류</p>
                            <p className="text-sm">{result.analysis_error}</p>
                        </div>
                    )}

                    {/* Validation Warnings */}
                    {result.validation && (result.validation.warnings.length > 0 || result.validation.errors.length > 0) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold mb-4">검증 결과</h3>
                            {result.validation.errors.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-red-600 font-medium mb-2">오류</h4>
                                    <ul className="list-disc list-inside text-sm text-red-600">
                                        {result.validation.errors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {result.validation.warnings.length > 0 && (
                                <div>
                                    <h4 className="text-yellow-600 font-medium mb-2">경고</h4>
                                    <ul className="list-disc list-inside text-sm text-yellow-600">
                                        {result.validation.warnings.map((warn, idx) => (
                                            <li key={idx}>{warn}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
