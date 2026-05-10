import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.AWS_S3_BUCKET || 'quiz-champ-files';
const ENDPOINT = process.env.AWS_STORAGE_ENDPOINT; // optional custom endpoint (MinIO, DO Spaces, etc.)

const s3 = new S3Client({
  region: REGION,
  ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Builds the public URL for an object.
 * Uses the custom endpoint when set, otherwise falls back to the standard AWS URL.
 */
function buildPublicUrl(key: string): string {
  if (ENDPOINT) {
    // Path-style: https://endpoint/bucket/key
    return `${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Uploads a buffer to S3 (or compatible storage) and returns the key and public URL.
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { key, url: buildPublicUrl(key) };
}

/**
 * Deletes an object from storage by key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Generates a pre-signed URL for temporary access to a private object.
 */
export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
