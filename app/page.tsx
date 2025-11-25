"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
    const { isLoggedIn } = useAuth();

    return (
        <div className="p-6 min-h-screen bg-white text-black">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">SamSamOO AI Platform</h1>
                    <p className="text-xl text-gray-600">
                        AI 기반 문서 분석 및 재무제표 분석 플랫폼
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {/* Financial Statement Analysis */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-3">📊 재무제표 분석</h2>
                        <p className="text-gray-600 mb-4">
                            PDF 업로드로 재무제표를 분석하고 재무비율을 계산하며 AI 인사이트를 제공합니다.
                        </p>
                        {isLoggedIn ? (
                            <Link
                                href="/financial-statements/list"
                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                시작하기
                            </Link>
                        ) : (
                            <p className="text-sm text-gray-500">로그인이 필요합니다</p>
                        )}
                    </div>

                    {/* Document Analysis */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-3">📄 문서 분석</h2>
                        <p className="text-gray-600 mb-4">
                            멀티 에이전트 시스템으로 문서를 업로드하고 심층 분석을 수행합니다.
                        </p>
                        {isLoggedIn ? (
                            <Link
                                href="/documents/list"
                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                시작하기
                            </Link>
                        ) : (
                            <p className="text-sm text-gray-500">로그인이 필요합니다</p>
                        )}
                    </div>

                    {/* Board System */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-3">💬 게시판</h2>
                        <p className="text-gray-600 mb-4">
                            사용자 커뮤니티 게시판에서 글을 작성하고 공유합니다.
                        </p>
                        {isLoggedIn ? (
                            <div className="space-x-2">
                                <Link
                                    href="/board/list"
                                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    전체 보기
                                </Link>
                                <Link
                                    href="/board/me"
                                    className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                >
                                    내 게시글
                                </Link>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">로그인이 필요합니다</p>
                        )}
                    </div>

                    {/* XBRL Analysis */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-3">📈 XBRL 분석</h2>
                        <p className="text-gray-600 mb-4">
                            XBRL/iXBRL 형식의 재무제표 파일을 업로드하여 재무비율을 자동 계산합니다.
                        </p>
                        {isLoggedIn ? (
                            <Link
                                href="/xbrl-analysis"
                                className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                            >
                                분석하기
                            </Link>
                        ) : (
                            <p className="text-sm text-gray-500">로그인이 필요합니다</p>
                        )}
                    </div>

                    {/* Anonymous Board */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h2 className="text-2xl font-bold mb-3">🔓 익명 게시판</h2>
                        <p className="text-gray-600 mb-4">
                            로그인 없이 누구나 자유롭게 글을 작성하고 읽을 수 있습니다.
                        </p>
                        <Link
                            href="/anonymous-board/list"
                            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            둘러보기
                        </Link>
                    </div>
                </div>

                {/* Login Prompt for Unauthenticated Users */}
                {!isLoggedIn && (
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                        <h3 className="text-xl font-bold mb-2">모든 기능을 사용하려면 로그인하세요</h3>
                        <p className="text-gray-600 mb-4">
                            Google 계정으로 간편하게 로그인하고 AI 분석 기능을 이용하세요.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            로그인하기
                        </Link>
                    </div>
                )}

                {/* Welcome Message for Authenticated Users */}
                {isLoggedIn && (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                        <h3 className="text-xl font-bold mb-2">환영합니다!</h3>
                        <p className="text-gray-600">
                            모든 기능을 자유롭게 이용하실 수 있습니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
