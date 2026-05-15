interface AdmitCardData {
    rollNumber: string;
    name: string;
    class: string;
    batchType: string;
    guardianName: string;
    mobileNumber: string;
    photoUrl?: string;
    eventName?: string;
    eventDate?: string;
    eventTime?: string;
    venue?: string;
    venueMapUrl?: string;
    ipAddress?: string;
}
export declare function generateAdmitCardPDF(data: AdmitCardData): Promise<Buffer>;
export {};
//# sourceMappingURL=admitCardPdf.d.ts.map