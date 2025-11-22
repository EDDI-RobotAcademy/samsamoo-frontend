import { NextRequest, NextResponse } from "next/server";
import AWS from "aws-sdk";

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ error: "파일 없음" }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileKey = `documents/${crypto.randomUUID()}-${file.name}`;

        const uploadResult = await s3
            .upload({
                Bucket: process.env.AWS_S3_BUCKET!,
                Key: fileKey,
                Body: buffer,
                ContentType: file.type,
            })
            .promise();

        return NextResponse.json({
            file_name: file.name,
            s3_key: fileKey,
            s3_url: uploadResult.Location, // 바로 사용할 수 있는 URL
        });
    } catch (err: any) {
        console.error("S3 업로드 에러:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
};
