export interface UploadResult {
    key: string;
    url: string;
}
/**
 * Uploads a buffer to S3 (or compatible storage) and returns the key and public URL.
 */
export declare function uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<UploadResult>;
/**
 * Deletes an object from storage by key.
 */
export declare function deleteFromS3(key: string): Promise<void>;
/**
 * Generates a pre-signed URL for temporary access to a private object.
 */
export declare function getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
//# sourceMappingURL=storage.d.ts.map