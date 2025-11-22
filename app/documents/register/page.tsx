"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DocumentRegisterPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState("");

    const upload = async () => {
        if (!file) return alert("파일을 선택해주세요!");

        setLoading(true);
        setUploaded(false);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "S3 업로드 실패");

            const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ file_name: file.name, s3_key: data.s3_key }),
            });

            const registerData = await registerRes.json();
            if (!registerRes.ok) throw new Error(registerData.error || "등록 실패");

            setUploaded(true);
            router.push("/documents/list");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
                <h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">문서 업로드</h1>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file"
                    />
                    <label htmlFor="file" className="cursor-pointer text-gray-500">
                        {file ? <p className="font-medium text-blue-600">{file.name}</p> : <p>PDF 파일 선택</p>}
                    </label>
                </div>

                <button
                    onClick={upload}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                    {loading ? "업로드 중..." : "업로드"}
                </button>

                {loading && <div className="flex justify-center mt-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}
                {uploaded && <p className="text-green-600 text-center mt-4">업로드 완료!</p>}
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </div>
        </div>
    );
}
