// FAQItem.tsx (수정됨: 상세 조회, 조회수, 답변 전체 로딩 추가)
"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // API 호출을 위해 axios 사용 가정 (fetch 사용 가능)

interface FAQItemType {
  id: number;
  question: string;
  answer_preview: string;
  category?: string;
  view_count: number; // 👈 조회수 필드 추가
  created_at: string;
}

interface FAQItemProps {
  item: FAQItemType;
}

const FAQItem: React.FC<FAQItemProps> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  // 상세 답변 내용을 저장할 상태 (API에서 상세 조회 시 로드됨)
  const [fullAnswer, setFullAnswer] = useState<string | null>(null);
  const [currentViewCount, setCurrentViewCount] = useState(item.view_count);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  // 💡 상세 조회 및 조회수 증가 로직
  const loadFullAnswer = async (faqId: number) => {
    if (fullAnswer !== null) return; // 이미 로드했으면 재요청 방지

    setLoadingAnswer(true);
    try {
      // 🚨 백엔드에서 상세 조회 시 조회수가 증가합니다.
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/faqs/detail/${faqId}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch FAQ detail');
      }
      // 백엔드의 FAQSummary DTO를 그대로 받는다고 가정
      const data: FAQItemType = await res.json(); 
      
      setFullAnswer(data.answer_preview); // answer_preview 대신 answer_full 필드 가정
      setCurrentViewCount(data.view_count); // 증가된 조회수 업데이트
      
    } catch (err) {
      console.error("Error loading full answer:", err);
      setFullAnswer("답변을 불러오는 데 실패했습니다.");
    } finally {
      setLoadingAnswer(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    // 닫힘 -> 열림 상태로 전환될 때만 상세 답변을 로드합니다.
    if (!isOpen && fullAnswer === null) {
      loadFullAnswer(item.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      {/* 질문 헤더: 클릭 시 답변 토글 */}
      <div 
        className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-150"
        onClick={toggleOpen}
      >
        <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="text-xs font-medium text-purple-500 mr-3 hidden sm:block">[{item.category || '기타'}]</span>
            <span className="font-semibold text-lg text-gray-800">Q. {item.question}</span>
        </div>
        
        {/* 토글 및 조회수 정보 */}
        <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden sm:inline">조회수: {currentViewCount}</span>
            <span className="text-xl text-blue-600 font-bold transition-transform duration-150">
                {isOpen ? '−' : '+'}
            </span>
        </div>
      </div>

      {/* 답변 내용: isOpen 상태일 때만 보여줍니다. */}
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200 text-gray-700 leading-relaxed">
            <p className="font-medium text-blue-600 mb-2">A.</p>
            {loadingAnswer ? (
                <p className="text-center text-sm text-gray-500">답변을 불러오는 중...</p>
            ) : (
                <div className="pl-4 whitespace-pre-wrap">
                    {/* 상세 답변이 로드되면 그것을 사용하고, 아니면 미리보기를 사용 */}
                    {fullAnswer || item.answer_preview}
                </div>
            )}
            
            {/* FAQ 생성일 정보 */}
            <div className="flex justify-end items-center space-x-3 text-xs text-gray-400 mt-2">
                <span className="text-gray-500 sm:hidden">조회수: {currentViewCount}</span>
                <span>작성일: {new Date(item.created_at).toLocaleDateString()}</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default FAQItem;