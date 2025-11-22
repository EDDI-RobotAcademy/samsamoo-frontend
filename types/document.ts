export interface DocumentMeta {
    id: string;
    originalName: string;
    s3Key: string;
    uploadedAt: string;
    status: "pending" | "processing" | "done";
}
