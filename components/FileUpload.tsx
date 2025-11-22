"use client";
import { useState } from "react";
import {useUpload} from "@/features/upload/upload";


export default function FileUpload() {
    const [file, setFile] = useState<File | null>(null);
    const { loading, document, error, upload } = useUpload();

    return (
        <div style={{ padding: "2rem" }}>
            <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <button onClick={() => file && upload(file)} disabled={loading} style={{ marginLeft: "1rem" }}>
                {loading ? "업로드 중..." : "업로드"}
            </button>

            {document && (
                <div>
                    <p>업로드 성공: {document.originalName}</p>
                    <p>S3 Key: {document.s3Key}</p>
                </div>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
