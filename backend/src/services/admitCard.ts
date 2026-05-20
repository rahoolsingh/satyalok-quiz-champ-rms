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
  reportingTime?: string;
  examTime?: string;
  venue?: string;
  venueMapUrl?: string;
  generatedAt: string;
  photoUrl?: string;
}

export function generateAdmitCardData(participant: Participant, eventDetails?: { eventDate?: string; eventTime?: string; reportingTime?: string; examTime?: string; venue?: string; venueMapUrl?: string }): AdmitCardData {
  if (!participant.rollNumber) {
    throw new Error('Participant does not have a roll number assigned');
  }

  return {
    rollNumber: participant.rollNumber,
    name: participant.name,
    class: participant.class,
    batchType: participant.batchType,
    guardianName: participant.guardianName,
    mobileNumber: participant.mobileNumber,
    eventName: 'Quiz Champ 2026',
    eventDate: eventDetails?.eventDate,
    eventTime: eventDetails?.eventTime,
    reportingTime: eventDetails?.reportingTime,
    examTime: eventDetails?.examTime,
    venue: eventDetails?.venue,
    venueMapUrl: eventDetails?.venueMapUrl,
    generatedAt: new Date().toISOString(),
    photoUrl: participant.photoUrl,
  };
}

export function generateAdmitCardHtml(data: AdmitCardData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admit Card - Quiz Champ 2026</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .card { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #1a237e; border-radius: 8px; padding: 30px; }
    .header { text-align: center; border-bottom: 2px solid #1a237e; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #1a237e; margin: 0; font-size: 24px; }
    .header p { color: #666; margin: 5px 0 0; }
    .roll-number { text-align: center; background: #1a237e; color: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .roll-number .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .roll-number .number { font-size: 36px; font-weight: bold; letter-spacing: 4px; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .detail-item .label { font-size: 11px; color: #999; text-transform: uppercase; }
    .detail-item .value { font-size: 15px; font-weight: 600; color: #333; }
    .batch-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${data.eventName}</h1>
      <p>Official Admit Card</p>
    </div>
    ${data.photoUrl ? `<div style="text-align:center;margin:16px 0"><img src="${data.photoUrl}" alt="Participant photo" style="width:100px;height:100px;object-fit:cover;border-radius:50%;border:2px solid #1a237e" /></div>` : ''}
    <div class="roll-number">
      <div class="label">Roll Number</div>
      <div class="number">${data.rollNumber}</div>
    </div>
    <div class="details">
      <div class="detail-item">
        <div class="label">Participant Name</div>
        <div class="value">${data.name}</div>
      </div>
      <div class="detail-item">
        <div class="label">Class</div>
        <div class="value">${data.class}</div>
      </div>
      <div class="detail-item">
        <div class="label">Batch</div>
        <div class="value"><span class="batch-badge">${data.batchType}</span></div>
      </div>
      <div class="detail-item">
        <div class="label">Guardian Name</div>
        <div class="value">${data.guardianName}</div>
      </div>
      <div class="detail-item">
        <div class="label">Mobile Number</div>
        <div class="value">${data.mobileNumber}</div>
      </div>
      <div class="detail-item">
        <div class="label">Generated At</div>
        <div class="value">${new Date(data.generatedAt).toLocaleDateString()}</div>
      </div>
    </div>
    <div class="footer">
      Please bring this admit card on the day of the quiz. Roll number is required for entry.
    </div>
  </div>
</body>
</html>`;
}
