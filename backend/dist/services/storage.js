"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = uploadToS3;
exports.deleteFromS3 = deleteFromS3;
exports.getPresignedUrl = getPresignedUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.AWS_S3_BUCKET || 'quiz-champ-files';
const ENDPOINT = process.env.AWS_STORAGE_ENDPOINT; // optional custom endpoint (MinIO, DO Spaces, etc.)
const s3 = new client_s3_1.S3Client({
    region: REGION,
    ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: true } : {}),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
/**
 * Builds the public URL for an object.
 * Uses the custom endpoint when set, otherwise falls back to the standard AWS URL.
 */
function buildPublicUrl(key) {
    if (ENDPOINT) {
        // Path-style: https://endpoint/bucket/key
        return `${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${key}`;
    }
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}
/**
 * Uploads a buffer to S3 (or compatible storage) and returns the key and public URL.
 */
async function uploadToS3(key, buffer, contentType) {
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
    return { key, url: buildPublicUrl(key) };
}
/**
 * Deletes an object from storage by key.
 */
async function deleteFromS3(key) {
    await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
/**
 * Generates a pre-signed URL for temporary access to a private object.
 */
async function getPresignedUrl(key, expiresInSeconds = 3600) {
    const command = new client_s3_1.GetObjectCommand({ Bucket: BUCKET, Key: key });
    return (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
}
//# sourceMappingURL=storage.js.map