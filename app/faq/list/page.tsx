"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import FAQItem from "../FAQItem";
import { useAuth } from "@/contexts/AuthContext";
import { FaSearch } from 'react-icons/fa';

interface FAQItemType {
    id: number;
    question: string;
    answer_preview: string;
    category: string;
    view_count: number;
    created_at: string;
}

interface SearchFAQResponse {
    items: FAQItemType[];
    has_next: boolean;
    message?: string;
}

const CATEGORIES = [
    { label: '전체', value: '' },
    { label: '계정', value: '계정' },
    { label: '결제', value: '결제' },
    { label: '서비스', value: '서비스' },
    { label: '기타', value: '기타' },
];

const PAGE_SIZE = 10;

export default function FAQList() {
    const [faqs, setFaqs] = useState<FAQItemType[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const observerTarget = useRef(null);
    const pageRef = useRef(0);
    const isInitialLoadRef = useRef(true);
    const currentCategoryRef = useRef('');
    const currentQueryRef = useRef('');

    const { isLoggedIn, role } = useAuth();

    const loadFaqs = useCallback(async (isSearch: boolean = false) => {
        const category = currentCategoryRef.current;
        const query = currentQueryRef.current;
        const pageToLoad = pageRef.current;

        if (loading || (!isSearch && !hasMore)) return;

        setLoading(true);

        try {
            const payload = {
                category: category || undefined,
                query: query || undefined,
                page: pageToLoad,
                size: PAGE_SIZE,
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/faqs/search`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    credentials: "include"
                }
            );

            if (!res.ok) {
                console.error("Failed to fetch FAQs", res.status);
                setLoading(false);
                return;
            }

            const data: SearchFAQResponse = await res.json();

            setFaqs(prev =>
                isSearch ? data.items : [...prev, ...data.items]
            );

            setHasMore(data.has_next);
            pageRef.current = pageToLoad + 1;

        } catch (err) {
            console.error("Error loading FAQs:", err);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore]);


    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        currentQueryRef.current = searchQuery;
        currentCategoryRef.current = selectedCategory;
        pageRef.current = 0;

        loadFaqs(true);
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedCategory(value);

        currentCategoryRef.current = value;
        currentQueryRef.current = searchQuery;

        pageRef.current = 0;
        loadFaqs(true);
    };

    const handleResetSearch = () => {
        setSelectedCategory('');
        setSearchQuery('');

        currentCategoryRef.current = '';
        currentQueryRef.current = '';

        pageRef.current = 0;

        loadFaqs(true);
    };

    useEffect(() => {
        if (isInitialLoadRef.current) {
            loadFaqs(true);
            isInitialLoadRef.current = false;
        }
    }, [loadFaqs]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadFaqs(false);
            }
        }, { threshold: 1.0 });

        const target = observerTarget.current;
        if (target) observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [hasMore, loading, loadFaqs]);

    return (
        <div className="p-6 min-h-screen bg-white text-black max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h1 className="text-3xl font-bold">자주 묻는 질문 (FAQ)</h1>

                <div className="flex space-x-2">
                    {isLoggedIn && role === "USER" && (
                        <Link
                            href="/inquiry/create"
                            className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 transition whitespace-nowrap text-sm"
                        >
                            1:1 문의하기
                        </Link>
                    )}
                    {isLoggedIn && role === "ADMIN" && (
                        <Link
                            href="/inquiry/admin"
                            className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700 transition whitespace-nowrap text-sm"
                        >
                            문의 리스트
                        </Link>
                    )}
                </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="p-2 border rounded w-full sm:w-auto"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="질문 내용을 검색하세요"
                    className="p-2 border rounded flex-grow"
                />

                <button
                    type="submit"
                    className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 transition flex items-center space-x-2"
                >
                    <FaSearch className="w-4 h-4" />
                    <span>검색</span>
                </button>

                <button
                    type="button"
                    onClick={handleResetSearch}
                    className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 transition"
                >
                    초기화
                </button>
            </form>

            {faqs.length === 0 && !loading ? (
                <p className="mt-8 text-center text-lg text-gray-500">
                    검색 결과가 없습니다.
                </p>
            ) : (
                <div className="space-y-4 mt-6">
                    {faqs.map((faq) => (
                        <FAQItem key={faq.id} item={faq} />
                    ))}

                    {hasMore && <div ref={observerTarget} style={{ height: '10px' }}></div>}

                    {loading && (
                        <p className="text-center p-4 text-blue-600">데이터를 불러오는 중...</p>
                    )}

                    {!hasMore && faqs.length > 0 && !loading && (
                        <p className="text-center p-4 text-gray-500">--- 마지막 FAQ 항목입니다. ---</p>
                    )}
                </div>
            )}
        </div>
    );
}
