import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export async function uploadPdfToS3(file: File) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `documents/${uuidv4()}-${file.name}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET!, // 환경변수 확인
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
    );

    return key;
}
