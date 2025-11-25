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
  
  // 💡 렌더링 디버깅용 로그
  console.log(`[RENDER] Page: ${page}, FileName: ${searchFileName}, Docs: ${documents.length}, TotalCount: ${totalCount}, Loading: ${loading}`);

  const handleAnalyze = async (doc: DocumentMeta) => {
    // ... (분석 로직 생략)
  };

  const handleDelete = async (docId: number, fileName: string) => {
    // ... (삭제 로직 생략)
  };

  // /documents/list 엔드포인트 처리 (전체 리스트 반환 가정)
  const fetchAllDocuments = useCallback(async (currentPage: number, currentSize: number) => { 
    console.log("[DEBUG] Attempting to fetch ALL documents...");
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
      
      console.log(`[API SUCCESS] fetchAllDocuments Data Length: ${listData?.length}`); 

      setDocuments(listData || []); 
      setTotalCount(listData.length || 0); 
      setHasNext(false); 

    } catch (e: any) {
      setError(e.message);
      setDocuments([]);
      console.error("[API ERROR] fetchAllDocuments failed:", e);
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

      console.log("[API REQUEST] Sending Search Query:", payload); // 💡 요청 로그 추가

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data: DocumentSearchResponse = await res.json(); 
      if (!res.ok) throw new Error(data.detail || "검색 실패");

      console.log(`[API SUCCESS] fetchSearchDocuments Data Length: ${data.data?.length}`); 
      console.log(`[API DEBUG] Total Count from API: ${data.total_count}`); 

      const apiTotalCount = data.total_count;
      const documentsLength = data.data?.length || 0;
      
      // ✅ 해결 로직: total_count가 API에서 누락되었을 경우, 최소한 현재 받은 문서 수를 TotalCount로 설정
      const newTotalCount = apiTotalCount !== undefined ? apiTotalCount : documentsLength;
      
      console.log(`[DEBUG] Final Total Count used: ${newTotalCount}`);

      setDocuments(data.data || []); 
      setTotalCount(newTotalCount); 
      setHasNext(data.has_next || false);
      
    } catch (e: any) {
      setError(e.message);
      setDocuments([]);
      console.error("[API ERROR] fetchSearchDocuments:", e);
    } finally {
      setLoading(false);
    }
  }, [searchFileName, uploadedFrom, uploadedTo, searchBy]); // 🚨 useCallback 의존성 유지 (handleSearch에서 사용)

  // 🚨🚨🚨 수정된 handleSearch: 검색 버튼 클릭 시 API 명시적 호출 🚨🚨🚨
  const handleSearch = () => {
    console.log("[ACTION] Search button clicked. Starting new search...");
    
    // 1. 페이지를 1로 리셋합니다.
    setPage(1); 
    
    // 2. 검색 API를 명시적으로 호출합니다.
    // (setPage가 비동기이므로, 페이지 이동을 위한 명시적인 page: 1과 현재 size를 사용)
    fetchSearchDocuments(1, size); 
  };

  // 💡💡💡 수정된 useEffect: 검색 필터 변경 시 자동 호출 방지 💡💡💡
  useEffect(() => {
    const hasSearchParams = searchFileName || uploadedFrom || uploadedTo;
    
    if (!hasSearchParams) {
        // 검색 조건이 없을 때: 페이지 변경 시 무조건 전체 문서 목록 로드 (초기 로딩 및 페이지 이동)
        fetchAllDocuments(page, size); 
    } else if (hasSearchParams && page !== 1) {
        // 검색 조건이 있고, 페이지가 1이 아닐 때: 페이지 이동 시 검색 결과 목록 로드
        // (page가 1일 때의 초기 검색은 handleSearch가 담당)
        fetchSearchDocuments(page, size);
    } else if (hasSearchParams && page === 1 && documents.length === 0) {
        // 검색 조건이 있지만 아직 한 번도 검색을 안 한 경우 (초기 로드 후 검색 버튼 클릭 대기)
        // 이 부분을 비워두어 초기 검색은 handleSearch에 의존하도록 유도합니다.
        // 하지만 초기 로드 시 documents가 비어있고 검색 조건이 있다면, fetchSearchDocuments를 호출해야 할 수도 있습니다. 
        // 🚨 임시 해결: 페이지가 1일 때 검색 조건이 있다면, 사용자가 검색 버튼을 누르도록 대기합니다.
        // (handleSearch가 API를 호출하므로 이 시점에서는 아무것도 하지 않습니다.)
    } else if (page === 1 && documents.length === 0) {
      // 컴포넌트 마운트 후 첫 페이지 로드 (검색 조건 없음)
      fetchAllDocuments(1, size);
    }


  // 🚨 의존성 배열에서 검색 필터 상태(searchFileName, uploadedFrom 등) 제거
  // 오직 page와 size 변경 시에만 API 요청이 발생합니다.
  }, [page, size, fetchAllDocuments, fetchSearchDocuments]);


  // 💡💡💡 페이지네이션을 위한 렌더링할 문서 목록 계산 💡💡💡
  const startIndex = (page - 1) * size;
  const endIndex = page * size;
  const documentsToRender = documents.slice(startIndex, endIndex);

  // 💡 페이징에 사용할 실제 TotalCount와 HasNext 값 설정
  const isSearchActive = searchFileName || uploadedFrom || uploadedTo;
  
  const effectiveTotalCount = isSearchActive 
      ? totalCount 
      : documents.length; 

  const effectiveHasNext = isSearchActive 
      ? hasNext 
      : (page * size) < documents.length;
      
  const totalPages = Math.ceil(effectiveTotalCount / size) || 1;


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center drop-shadow-sm">
          문서 분석 시스템 📄
        </h1>

        {/* 문서 업로드 버튼 생략 */}
        {/* ---------------- 검색 필터 영역 ---------------- */}
        <div className="bg-white shadow-xl rounded-xl p-6 mb-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">문서 검색 필터</h2>
          {/* ... 필터 입력 필드 유지 ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 검색 기준 드롭다운 */}
            <div>
              <label htmlFor="search-by" className="block text-sm font-medium text-gray-700 mb-1">기준일 선택</label>
              <select
                id="search-by"
                value={searchBy}
                onChange={(e) => {
                  setSearchBy(e.target.value as "uploaded" | "updated");
                  // setPage(1) 제거: 검색 조건 변경 시 자동 요청 방지
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
                  setPage(1); // 페이지 사이즈 변경은 즉시 1페이지로 이동/재검색을 유발
                }}
                className="block w-24 pl-3 pr-10 py-3 text-base text-gray-900 border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              >
                {[5, 10, 20, 50].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* 🚨 검색 버튼 클릭 시 명시적으로 API 호출 */}
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <FaSearch className="mr-2 -ml-1 h-5 w-5" />
              검색
            </button>
          </div>
        </div>

        {/* 로딩 및 에러 메시지 */}
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

        {/* 🚨🚨🚨 검색 결과 없음 문구 조건 (최종 강화된 로직) 🚨🚨🚨 */}
        { 
          !loading && 
          !error && 
          effectiveTotalCount === 0 && 
          (isSearchActive || documents.length === 0) && ( 
            <p className="text-center text-gray-600 text-lg py-8">검색 결과가 없습니다. 조건을 변경해 보세요!</p>
          )
        }

        {/* 🌟🌟🌟 문서 목록 렌더링: documentsToRender 사용 🌟🌟🌟 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documentsToRender.map((doc) => {
            const s3Url = `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${doc.s3_key}`; 
            const result = analyzeResults[doc.id];
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
                  <p className="text-xs text-gray-500">수정일: {updatedDate}</p>

                  {/* 분석 결과 표시 생략 */}
                </div>
                
                {/* 액션 버튼들 생략 */}
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