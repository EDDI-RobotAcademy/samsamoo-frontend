"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function XBRLAnalysisCreate() {
    const router = useRouter();
    const { isLoggedIn } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [corpName, setCorpName] = useState("");
    const [corpCode, setCorpCode] = useState("");
    const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState("annual");
    const [industry, setIndustry] = useState("default");
    const [includeLLM, setIncludeLLM] = useState(true);
    const [generateReports, setGenerateReports] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
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

        if (!corpName.trim()) {
            setError("회사명을 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgress("분석을 시작합니다...");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("corp_name", corpName);
            formData.append("corp_code", corpCode || "MANUAL");
            formData.append("fiscal_year", fiscalYear.toString());
            formData.append("report_type", reportType);
            formData.append("industry", industry);
            formData.append("include_llm", includeLLM.toString());
            formData.append("generate_reports", generateReports.toString());

            setProgress("파일을 업로드하고 분석을 진행합니다...");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/xbrl/analyses/create`,
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "분석 생성에 실패했습니다.");
            }

            const data = await response.json();
            setProgress("분석이 완료되었습니다! 상세 페이지로 이동합니다...");

            // Redirect to detail page
            setTimeout(() => {
                router.push(`/xbrl-analysis/${data.id}`);
            }, 1000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
            setProgress("");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-slate-100">
                <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-8 px-6 shadow-lg">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold">새 XBRL 분석</h1>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto p-6">
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
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">새 XBRL 분석 생성</h1>
                            <p className="text-indigo-100 text-lg">
                                XBRL/iXBRL 파일을 업로드하여 재무분석을 수행하고 결과를 저장합니다.
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
                                분석 목록
                            </Link>
                            <Link
                                href="/xbrl-analysis"
                                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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

            <div className="max-w-4xl mx-auto p-6">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        파일 업로드 및 설정
                    </h2>

                    {/* File Upload */}
                    <div className="mb-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                회사명 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={corpName}
                                onChange={(e) => setCorpName(e.target.value)}
                                placeholder="예: 삼성전자"
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
                            />
                        </div>

                        {/* Company Code */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                회사코드 (선택)
                            </label>
                            <input
                                type="text"
                                value={corpCode}
                                onChange={(e) => setCorpCode(e.target.value)}
                                placeholder="예: 00126380 (DART 고유번호)"
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
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
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
                            />
                        </div>

                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                보고서 유형
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 bg-white"
                            >
                                <option value="annual">연간 (사업보고서)</option>
                                <option value="semi_annual">반기 (반기보고서)</option>
                                <option value="quarterly">분기 (분기보고서)</option>
                            </select>
                        </div>

                        {/* Industry */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                산업 분류
                            </label>
                            <select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 bg-white"
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
                    </div>

                    {/* Options */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-4">분석 옵션</h3>
                        <div className="space-y-3">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeLLM}
                                    onChange={(e) => setIncludeLLM(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                                />
                                <div>
                                    <span className="text-slate-800 font-medium">AI 분석 포함</span>
                                    <p className="text-sm text-slate-500">LLM 기반 재무 분석 및 투자 의견 생성</p>
                                </div>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={generateReports}
                                    onChange={(e) => setGenerateReports(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                                />
                                <div>
                                    <span className="text-slate-800 font-medium">리포트 생성</span>
                                    <p className="text-sm text-slate-500">PDF/Markdown 형식으로 다운로드 가능한 리포트 생성</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Progress Display */}
                    {progress && (
                        <div className="mt-6 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 px-6 py-4 rounded-lg">
                            <div className="flex items-center">
                                {isLoading && (
                                    <svg className="animate-spin mr-3 h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                <p className="font-medium">{progress}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="submit"
                            disabled={isLoading || !file}
                            className={`flex-1 px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center ${
                                isLoading || !file
                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
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
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                    분석 시작 및 저장
                                </>
                            )}
                        </button>
                        <Link
                            href="/xbrl-analysis/list"
                            className="px-8 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                        >
                            취소
                        </Link>
                    </div>
                </form>

                {/* Help Info */}
                <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        도움말
                    </h3>
                    <ul className="text-sm text-slate-600 space-y-2">
                        <li className="flex items-start">
                            <svg className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            XBRL/iXBRL 형식의 재무제표 파일을 업로드하세요.
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            DART에서 다운로드한 공시 파일을 지원합니다.
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            AI 분석은 OpenAI 또는 Anthropic API 키가 설정되어 있어야 합니다.
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 mr-2 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            분석 결과는 저장되어 나중에 다시 확인할 수 있습니다.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
