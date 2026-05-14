import { Participant } from '../types';
export interface AdmitCardData {
    rollNumber: string;
    name: string;
    class: string;
    batchType: string;
    guardianName: string;
    mobileNumber: string;
    eventName: string;
    eventDate?: string;
    eventTime?: string;
    venue?: string;
    venueMapUrl?: string;
    generatedAt: string;
    photoUrl?: string;
}
export declare function generateAdmitCardData(participant: Participant, eventDetails?: {
    eventDate?: string;
    eventTime?: string;
    venue?: string;
    venueMapUrl?: string;
}): AdmitCardData;
export declare function generateAdmitCardHtml(data: AdmitCardData): string;
//# sourceMappingURL=admitCard.d.ts.map