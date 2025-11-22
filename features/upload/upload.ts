import { useState } from "react";
import { DocumentMeta } from "../../types/document";

export function useUpload() {
    const [loading, setLoading] = useState(false);
    const [document, setDocument] = useState<DocumentMeta | null>(null);
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: File) => {
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "업로드 실패");
            setDocument(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, document, error, upload };
}
