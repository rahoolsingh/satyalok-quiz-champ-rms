interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content?: Buffer;
        path?: string;
    }>;
}
export declare function sendEmail(options: EmailOptions): Promise<void>;
export declare function generateAdmitCardEmail(data: {
    name: string;
    rollNumber: string;
    batch: string;
    eventDate?: string;
}): string;
export {};
//# sourceMappingURL=email.d.ts.map