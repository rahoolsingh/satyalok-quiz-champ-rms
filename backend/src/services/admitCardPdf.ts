import PDFDocument from 'pdfkit';
import axios from 'axios';
import { Readable } from 'stream';

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
  venue?: string;
}

export async function generateAdmitCardPDF(data: AdmitCardData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header with gradient effect (simulated with rectangles)
      doc.rect(0, 0, 595, 120).fill('#0071e3');
      
      // Title
      doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
        .text('QUIZ CHAMP 2026', 0, 35, { align: 'center' });
      
      doc.fontSize(14).fillColor('#ffffff').font('Helvetica')
        .text('ADMIT CARD', 0, 70, { align: 'center' });

      // Reset position
      doc.y = 140;

      // Photo section (if available)
      if (data.photoUrl) {
        try {
          const photoResponse = await axios.get(data.photoUrl, { responseType: 'arraybuffer' });
          const photoBuffer = Buffer.from(photoResponse.data);
          
          // Draw photo border
          doc.rect(420, 140, 130, 150).stroke('#d2d2d7');
          
          // Add photo
          doc.image(photoBuffer, 425, 145, {
            width: 120,
            height: 140,
            align: 'center',
          });
        } catch (err) {
          console.error('Failed to load photo:', err);
          // Draw placeholder
          doc.rect(420, 140, 130, 150).stroke('#d2d2d7');
          doc.fontSize(10).fillColor('#86868b')
            .text('Photo', 420, 205, { width: 130, align: 'center' });
        }
      }

      // Details section
      doc.y = 160;
      doc.fillColor('#1d1d1f').font('Helvetica-Bold').fontSize(12);

      const addField = (label: string, value: string, y: number) => {
        doc.fillColor('#86868b').font('Helvetica').fontSize(10)
          .text(label, 50, y);
        doc.fillColor('#1d1d1f').font('Helvetica-Bold').fontSize(12)
          .text(value, 50, y + 15);
        
        // Underline
        doc.moveTo(50, y + 32).lineTo(380, y + 32).stroke('#d2d2d7');
      };

      addField('Roll Number', data.rollNumber, 160);
      addField('Name', data.name, 210);
      addField('Class', data.class, 260);
      addField('Batch', data.batchType === 'JUNIOR' ? 'Junior (Classes 1-7)' : 'Senior (Classes 8-12)', 310);
      addField('Guardian Name', data.guardianName, 360);
      addField('Mobile Number', data.mobileNumber, 410);

      // Event details box
      doc.y = 480;
      doc.rect(50, 480, 495, 100).fillAndStroke('#f5f5f7', '#d2d2d7');
      
      doc.fillColor('#0071e3').font('Helvetica-Bold').fontSize(12)
        .text('Event Details', 60, 495);
      
      doc.fillColor('#1d1d1f').font('Helvetica').fontSize(10)
        .text(`Event: ${data.eventName || 'Quiz Champ 2026 Competition'}`, 60, 520)
        .text(`Date: ${data.eventDate || 'To be announced'}`, 60, 540)
        .text(`Venue: ${data.venue || 'To be announced'}`, 60, 560);

      // Instructions
      doc.y = 600;
      doc.fillColor('#1d1d1f').font('Helvetica-Bold').fontSize(11)
        .text('Important Instructions:', 50, 600);
      
      doc.fillColor('#1d1d1f').font('Helvetica').fontSize(9)
        .text('• Carry this admit card and a valid ID proof on the day of the event', 50, 620)
        .text('• Report to the venue 30 minutes before the scheduled time', 50, 635)
        .text('• Mobile phones and electronic devices are not allowed during the quiz', 50, 650)
        .text('• Follow all instructions given by the organizers', 50, 665);

      // Footer
      doc.y = 720;
      doc.rect(0, 720, 595, 82).fill('#f5f5f7');
      
      doc.fillColor('#86868b').font('Helvetica').fontSize(9)
        .text('Organized by Satyalok Foundation', 0, 740, { align: 'center' })
        .text('For queries: support@quizchamp.com', 0, 755, { align: 'center' });

      // Signature placeholder
      doc.fillColor('#1d1d1f').font('Helvetica-Bold').fontSize(8)
        .text('Authorized Signature', 450, 775);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
