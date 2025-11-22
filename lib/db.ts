import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createDocumentMeta(originalName: string, s3Key: string) {
    return prisma.document.create({
        data: {
            originalName,
            s3Key,
            status: "pending",
        },
    });
}
