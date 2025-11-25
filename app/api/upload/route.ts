import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ error: "파일 없음" }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileKey = `documents/${crypto.randomUUID()}-${file.name}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: fileKey,
                Body: buffer,
                ContentType: file.type,
            })
        );

        const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        return NextResponse.json({
            file_name: file.name,
            s3_key: fileKey,
            s3_url: s3Url,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
};
