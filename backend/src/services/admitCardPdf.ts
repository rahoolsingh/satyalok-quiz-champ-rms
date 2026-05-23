import puppeteer from 'puppeteer';
import ejs from 'ejs';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export interface AdmitCardData {
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
  reportingTime?: string;
  examTime?: string;
  venue?: string;
  venueMapUrl?: string;
  participantId?: string;
  questionPaperLanguage?: string;
}

export async function generateAdmitCardPDF(data: AdmitCardData): Promise<Buffer> {
  // Generate QR codes
  const systemData = JSON.stringify({
    id: data.participantId || 'N/A',
    roll: data.rollNumber,
    name: data.name,
    batch: data.batchType,
  });

  const omrData = JSON.stringify({
    id: data.participantId || 'N/A',
    roll: data.rollNumber,
    name: data.name,
    guardian: data.guardianName,
    class: data.class,
    batch: data.batchType,
    mobile: data.mobileNumber,
  });

  const [systemQrCode, mapQrCode, omrQrCode] = await Promise.all([
    QRCode.toDataURL(systemData, { width: 150, margin: 1 }),
    data.venueMapUrl
      ? QRCode.toDataURL(data.venueMapUrl, { width: 150, margin: 1 })
      : Promise.resolve(null),
    QRCode.toDataURL(omrData, { width: 500, margin: 1 }),
  ]);

  // Prepare template variables
  console.log('[AdmitCard PDF] Data received:', { reportingTime: data.reportingTime, examTime: data.examTime, eventDate: data.eventDate });
  const templateVars = {
    admitCardType: data.batchType === 'JUNIOR' ? 'JUNIOR ADMIT CARD' : 'SENIOR ADMIT CARD',
    competitionYear: '2026',
    organizationName: 'Satyalok - A New Hope',
    examDate: data.eventDate || 'To be announced',
    reportingTime: data.reportingTime || 'TBA',
    examTime: data.examTime || 'TBA',
    rollNumber: data.rollNumber,
    candidateName: data.name,
    studentClass: data.class,
    batchCategory: data.batchType === 'JUNIOR' ? 'Junior Batch (5-10)' : 'Senior Batch (10+)',
    batchType: data.batchType === 'JUNIOR' ? 'Junior' : 'Senior',
    guardianName: data.guardianName,
    mobileNumber: `+91 ${data.mobileNumber}`,
    centreDetails: data.venue || 'To be announced',
    candidatePhotoUrl: data.photoUrl || null,
    systemQrCode,
    mapQrCode,
    omrQrCode,
    paperLanguage: data.questionPaperLanguage ? (data.questionPaperLanguage === 'HINDI' ? 'Hindi' : 'English') : 'Not Selected',
    generatedDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }),
    systemId: data.participantId ? data.participantId.slice(-8).toUpperCase() : 'N/A',
  };

  // Render EJS template
  const templatePath = path.join(__dirname, '..', 'admit-card.ejs');
  let templateContent: string;

  if (fs.existsSync(templatePath)) {
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  } else {
    // Fallback for compiled dist folder
    const distTemplatePath = path.join(process.cwd(), 'dist', 'admit-card.ejs');
    templateContent = fs.readFileSync(distTemplatePath, 'utf-8');
  }

  const html = ejs.render(templateContent, templateVars);

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
