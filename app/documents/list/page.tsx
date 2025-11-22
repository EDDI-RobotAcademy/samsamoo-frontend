"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface DocumentMeta {
    id: number;
    file_name: string;
    s3_key: string;
    uploader_id: number;
}

interface AnalyzeResultType {
    parsed_text: string;
    summaries: {
        bullet: string;
        abstract: string;
        casual: string;
        final: string;
    };
    answer: string;
}

export default function DocumentListPage() {
    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [analyzeResults, setAnalyzeResults] = useState<Record<number, AnalyzeResultType>>({});
    const [analyzingId, setAnalyzingId] = useState<number | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/list`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "문서 목록 불러오기 실패");
            setDocuments(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (doc: DocumentMeta) => {
        const s3Url = `https://s3-eddi-pjs-bucket.s3.ap-northeast-2.amazonaws.com/${doc.s3_key}`;
        setAnalyzingId(doc.id);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents-multi-agents/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    doc_id: doc.id,
                    doc_url: s3Url,
                    question: "Summarize the content",
                }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "분석 실패");

            setAnalyzeResults(prev => ({
                ...prev,
                [doc.id]: data,
            }));
        } catch (e: any) {
            alert(`분석 실패: ${e.message}`);
        } finally {
            setAnalyzingId(null);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">문서 리스트</h1>

            <div className="text-center mb-6">
                <Link
                    href="/documents/register"
                    className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
                >
                    문서 업로드
                </Link>
            </div>

            {loading && <p className="text-center text-gray-700">불러오는 중...</p>}
            {error && <p className="text-center text-red-600 font-medium">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => {
                    const s3Url = `https://s3-eddi-pjs-bucket.s3.ap-northeast-2.amazonaws.com/${doc.s3_key}`;
                    const result = analyzeResults[doc.id];
                    const isAnalyzing = analyzingId === doc.id;

                    return (
                        <div key={doc.id} className="bg-white shadow rounded-lg p-4 flex flex-col">
                            <p className="font-medium text-gray-900">{doc.file_name}</p>
                            <a
                                href={s3Url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-blue-600 hover:underline"
                            >
                                열기
                            </a>

                            <button
                                onClick={() => handleAnalyze(doc)}
                                disabled={isAnalyzing}
                                className={`mt-2 px-3 py-1 rounded text-white ${
                                    isAnalyzing ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                                }`}
                            >
                                {isAnalyzing ? "분석 중..." : "분석"}
                            </button>

                            <p className="mt-auto text-gray-500 text-sm">Uploader ID: {doc.uploader_id}</p>

                            {result && (
                                <div className="mt-4 bg-gray-50 border border-gray-300 p-3 rounded shadow-inner text-gray-800">
                                    <h3 className="font-semibold mb-1 text-gray-900">Parsed Text</h3>
                                    <pre className="whitespace-pre-wrap text-sm">{result.parsed_text}</pre>

                                    <h3 className="font-semibold mt-3 mb-1 text-gray-900">Summaries</h3>
                                    <ul className="list-disc list-inside text-sm">
                                        <li><strong>Bullet:</strong> {result.summaries.bullet}</li>
                                        <li><strong>Abstract:</strong> {result.summaries.abstract}</li>
                                        <li><strong>Casual:</strong> {result.summaries.casual}</li>
                                        <li><strong>Final:</strong> {result.summaries.final}</li>
                                    </ul>

                                    <h3 className="font-semibold mt-3 mb-1 text-gray-900">Answer</h3>
                                    <p className="text-sm">{result.answer}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
