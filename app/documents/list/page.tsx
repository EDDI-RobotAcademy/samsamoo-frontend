"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { FaSearch, FaUpload, FaFileAlt, FaTrashAlt, FaSpinner } from 'react-icons/fa';

// DocumentMeta 인터페이스
interface DocumentMeta {
  id: number;
  file_name: string;
  s3_key: string;
  uploader_id: number;
  uploaded_at: string;
  updated_at: string;
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

// /documents/search 엔드포인트 응답 구조 (페이징 정보 포함)
interface DocumentSearchResponse {
    data: DocumentMeta[] | undefined; 
    total_count: number;
    page: number;
    size: number;
    has_next: boolean;
    detail?: string;
}

// 환경 변수 설정
// 환경 변수가 없을 경우에 대비해 S3 URL을 임시로 하드코딩된 값으로 대체 (실제 환경에서는 NEXT_PUBLIC_S3_BASE_URL 사용 권장)
// const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || "https://s3-eddi-pjs-bucket.s3.ap-northeast-2.amazonaws.com";

const getS3Url = (s3Key: string) => {
  const bucket = process.env.AWS_S3_BUCKET || "s3-eddi-pjs-bucket";
  const region = process.env.AWS_REGION || "ap-northeast-2";
  return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
};

export default function DocumentListPage() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyzeResults, setAnalyzeResults] = useState<Record<number, AnalyzeResultType>>({});
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  
  // 검색 관련 상태
  const [searchFileName, setSearchFileName] = useState("");
  const [uploadedFrom, setUploadedFrom] = useState("");
  const [uploadedTo, setUploadedTo] = useState("");
  const [searchBy, setSearchBy] = useState<"uploaded" | "updated">("uploaded"); 
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0); 
  const [hasNext, setHasNext] = useState(false);

  // /documents/list 엔드포인트 처리 (전체 리스트 반환 가정)
  const fetchAllDocuments = useCallback(async (currentPage: number, currentSize: number) => { 
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/list?page=${currentPage}&size=${currentSize}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "전체 문서 불러오기 실패");
      }
      
      const listData: DocumentMeta[] = await res.json(); 
      setDocuments(listData || []); 
      setTotalCount(listData.length || 0); 
      setHasNext(false); 

    } catch (e: any) {
      setError(e.message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []); 

  // /documents/search 엔드포인트 처리 (페이징된 리스트 반환 가정)
  const fetchSearchDocuments = useCallback(async (currentPage: number, currentSize: number) => { 
    setLoading(true);
    setError("");

    try {
      const payload = {
        file_name: searchFileName || undefined,
        uploaded_from: searchBy === "uploaded" ? uploadedFrom || undefined : undefined,
        uploaded_to: searchBy === "uploaded" ? uploadedTo || undefined : undefined,
        updated_from: searchBy === "updated" ? uploadedFrom || undefined : undefined,
        updated_to: searchBy === "updated" ? uploadedTo || undefined : undefined,
        page: currentPage,
        size: currentSize,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data: DocumentSearchResponse = await res.json(); 
      if (!res.ok) throw new Error(data.detail || "검색 실패");

      const apiTotalCount = data.total_count;
      const documentsLength = data.data?.length || 0;
      const newTotalCount = apiTotalCount !== undefined ? apiTotalCount : documentsLength;
      
      setDocuments(data.data || []); 
      setTotalCount(newTotalCount); 
      setHasNext(data.has_next || false);
      
    } catch (e: any) {
      setError(e.message);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [searchFileName, uploadedFrom, uploadedTo, searchBy]); 

  // handleAnalyze: useCallback 적용
  const handleAnalyze = useCallback(async (doc: DocumentMeta) => {
       
    const s3Url = getS3Url(doc.s3_key);

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
  }, []); 


  // handleDelete: useCallback 적용 (로직 생략)
  const handleDelete = useCallback(async (docId: number, fileName: string) => {
    if (window.confirm(`정말 파일 '${fileName}'(ID: ${docId})을(를) 삭제하시겠습니까?`)) {
        // ... (삭제 로직)
        alert(`삭제 기능 준비 중: ${fileName} 삭제 요청`);
    }
  }, []); 

  
  // handleSearch: 검색 버튼 클릭 시 API 명시적 호출
  const handleSearch = () => {
    setPage(1); 
    fetchSearchDocuments(1, size); 
  };

  // useEffect: 페이지 및 사이즈 변경 시 또는 초기 로딩 시 API 요청
  useEffect(() => {
    const hasSearchParams = searchFileName || uploadedFrom || uploadedTo;
    
    if (!hasSearchParams) {
        fetchAllDocuments(page, size); 
    } else {
        fetchSearchDocuments(page, size);
    }
  }, [page, size, fetchAllDocuments, fetchSearchDocuments]);


  // 페이징 관련 계산 로직
  const isSearchActive = searchFileName || uploadedFrom || uploadedTo;
  
  const effectiveTotalCount = isSearchActive 
      ? totalCount 
      : documents.length; 

  const effectiveHasNext = isSearchActive 
      ? hasNext 
      : (page * size) < documents.length;
      
  const totalPages = Math.ceil(effectiveTotalCount / size) || 1;
  
  const documentsToRender = documents;


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center drop-shadow-sm">
          문서 분석 시스템 📄
        </h1>

        <div className="bg-white shadow-xl rounded-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">문서 검색 필터</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 검색 기준 드롭다운 */}
            <div>
              <label htmlFor="search-by" className="block text-sm font-medium text-gray-700 mb-1">기준일 선택</label>
              <select
                id="search-by"
                value={searchBy}
                onChange={(e) => {
                  setSearchBy(e.target.value as "uploaded" | "updated");
                }}
                className="mt-1 block w-full pl-3 pr-10 py-3 text-base text-gray-900 border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-base rounded-md shadow-sm"
              >
                <option value="uploaded">등록일 기준</option>
                <option value="updated">수정일 기준</option>
              </select>
            </div>
            {/* 파일 이름 검색 */}
            <div>
              <label htmlFor="file-name" className="block text-sm font-medium text-gray-700 mb-1">파일 이름</label>
              <input
                id="file-name"
                type="text"
                placeholder="파일 이름 검색..."
                value={searchFileName}
                onChange={(e) => {
                  setSearchFileName(e.target.value);
                }}
                className="mt-1 block w-full shadow-sm text-base py-3 text-gray-900 border-gray-300 bg-gray-50 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* 날짜 범위 입력 - From */}
            <div>
              <label htmlFor="uploaded-from" className="block text-sm font-medium text-gray-700 mb-1">날짜 범위 (시작)</label>
              <input
                id="uploaded-from"
                type="date"
                value={uploadedFrom}
                onChange={(e) => {
                  setUploadedFrom(e.target.value);
                }}
                className="mt-1 block w-full shadow-sm text-base py-3 text-gray-900 border-gray-300 bg-gray-50 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* 날짜 범위 입력 - To */}
            <div>
              <label htmlFor="uploaded-to" className="block text-sm font-medium text-gray-700 mb-1">날짜 범위 (끝)</label>
              <input
                id="uploaded-to"
                type="date"
                value={uploadedTo}
                onChange={(e) => {
                  setUploadedTo(e.target.value);
                }}
                className="mt-1 block w-full shadow-sm text-base py-3 text-gray-900 border-gray-300 bg-gray-50 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>


          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100 gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm font-medium text-gray-700 whitespace-nowrap">한 페이지 문서 수:</label>
              <select
                id="page-size"
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(1);
                }}
                className="block w-24 pl-3 pr-10 py-3 text-base text-gray-900 border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              >
                {[5, 10, 20, 50].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4"> 
                <Link
                    href="/documents/register"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                >
                    <FaUpload className="mr-2 -ml-1 h-5 w-5" />
                    문서 업로드
                </Link>
                <button
                    onClick={handleSearch}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                    <FaSearch className="mr-2 -ml-1 h-5 w-5" />
                    검색 실행
                </button>
            </div>
          </div>
        </div>

        {/* 로딩/에러 */}
        {loading && (
          <p className="text-center text-indigo-700 text-lg flex items-center justify-center py-8">
            <FaSpinner className="animate-spin mr-3 h-5 w-5" /> 데이터 불러오는 중...
          </p>
        )}
        {error && (
          <p className="text-center text-red-600 font-medium text-lg bg-red-50 p-4 rounded-md shadow-sm mb-8">
            오류: {error}
          </p>
        )}

        {/* 결과 없음 */}
        {!loading && !error && effectiveTotalCount === 0 && (isSearchActive || documents.length === 0) && (
          <p className="text-center text-gray-600 text-lg py-8">검색 결과가 없습니다. 조건을 변경해 보세요!</p>
        )}

        {/* 문서 목록 렌더링 */}
        {/* 💡 [참고] 카드 높이 문제는 CSS Grid의 기본 동작으로, Tailwind class만으로는 해결이 어렵습니다. */}
        {/* Grid 대신 Flex Column이나 Masonry-like 라이브러리를 사용해야 근본적으로 해결됩니다. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documentsToRender.map((doc) => {
            const s3Url = getS3Url(doc.s3_key);
            const result = analyzeResults[doc.id]; // 💡 분석 결과 변수 정의
            const isAnalyzing = analyzingId === doc.id;
            const uploadedDate = doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A';
            const updatedDate = doc.updated_at ? new Date(doc.updated_at).toLocaleDateString() : 'N/A';
            
            return (
              <div key={doc.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col border border-gray-200">
                <div className="p-5 flex-grow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 flex items-center">
                    <FaFileAlt className="text-indigo-500 mr-2" />
                    {doc.file_name}
                  </h3>
                  <a
                    href={s3Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                  >
                    문서 열기 (S3)
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>

                  <p className="text-xs text-gray-500 mt-3">업로더 ID: {doc.uploader_id}</p>
                  <p className="text-xs text-gray-500">등록일: {uploadedDate}</p>
                  <p className="text-xs text-gray-500 mb-4">수정일: {updatedDate}</p>

                  {/* 🌟 [수정] 상세 분석 결과 섹션 전체를 <details>로 래핑 🌟 */}
                  {result && !isAnalyzing ? (
                    <details className="mt-4 border border-gray-300 rounded-md shadow-sm bg-indigo-50/50">
                        <summary className="font-bold text-base text-gray-900 p-3 bg-indigo-100/50 hover:bg-indigo-100 cursor-pointer transition-colors duration-200 flex justify-between items-center">
                            <span>✅ 분석 결과 요약 보기</span>
                            <span className="text-sm font-normal text-indigo-700">클릭하여 펼치기/접기</span>
                        </summary>
                        
                        <div className="p-3 text-gray-800">
                            <h4 className="font-bold text-base text-gray-900 mb-2 border-b pb-1">상세 분석 내용</h4>
                            
                            <details className="text-sm cursor-pointer text-gray-700 mb-2">
                                <summary className="font-semibold text-indigo-700 hover:text-indigo-900">파싱된 원문 보기 (Parsed Text)</summary>
                                {/* 💡 주의: parsed_text에 깨진 문자가 있다면 백엔드 파싱 문제이므로 수정 필요 */}
                                <pre className="whitespace-pre-wrap text-xs bg-white p-2 border rounded mt-2 max-h-40 overflow-auto">{result.parsed_text}</pre>
                            </details>
                            
                            <h5 className="font-semibold mt-3 mb-1 text-gray-900 text-sm">요약 유형별 결과</h5>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li><strong>Bullet:</strong> <span className="text-gray-600">{result.summaries.bullet}</span></li>
                                <li><strong>Abstract:</strong> <span className="text-gray-600">{result.summaries.abstract}</span></li>
                                <li><strong>Casual:</strong> <span className="text-gray-600">{result.summaries.casual}</span></li>
                                <li><strong>Final:</strong> <span className="text-gray-600">{result.summaries.final}</span></li>
                            </ul>
                            
                            <h5 className="font-semibold mt-3 mb-1 text-gray-900 text-sm">질문 답변 (Answer)</h5>
                            <p className="text-sm bg-white p-2 border rounded">{result.answer}</p>
                        </div>
                    </details>
                  ) : (
                    // 분석 결과가 없으면 아무것도 렌더링하지 않아 공간이 늘어나지 않습니다.
                    null 
                  )}
                  
                </div>
                
                {/* 액션 버튼들 */}
                  <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-center gap-3">                  
                    <button
                    onClick={() => handleAnalyze(doc)}
                    disabled={isAnalyzing}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm ${
                      isAnalyzing
                        ? "bg-indigo-300 text-gray-700 cursor-not-allowed"
                        : "bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    } transition-all duration-200`}
                  >
                    {isAnalyzing ? (
                      <>
                        <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" /> 분석 중...
                      </>
                    ) : (
                      <>
                        <FaFileAlt className="-ml-1 mr-2 h-4 w-4" /> 분석
                      </>
                    )}
                  </button>
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDelete(doc.id, doc.file_name)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                  >
                    <FaTrashAlt className="-ml-1 mr-2 h-4 w-4" /> 삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <hr className="my-10 border-t border-gray-300"/>

        {/* ---------------- 페이지네이션 ---------------- */}
        {effectiveTotalCount > 0 && (
            <div className="flex justify-center items-center mt-10 space-x-4">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    이전 페이지
                </button>
                <span className="text-lg font-medium text-gray-800">
                    {page} / {totalPages} 페이지
                </span>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!effectiveHasNext || loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    다음 페이지
                </button>
            </div>
        )}
      </div>
    </div>
  );
}