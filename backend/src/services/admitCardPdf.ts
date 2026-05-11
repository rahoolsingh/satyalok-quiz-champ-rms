import PDFDocument from 'pdfkit';
import axios from 'axios';

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
      // A4 size: 595.28 x 841.89 points (210mm x 297mm)
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);

      // ========== HEADER SECTION ==========
      // Blue gradient header background
      doc.rect(0, 0, pageWidth, 140).fill('#0071e3');
      
      // Add decorative top border
      doc.rect(0, 0, pageWidth, 8).fill('#005bb5');
      
      // Main title
      doc.fontSize(32).fillColor('#ffffff').font('Helvetica-Bold')
        .text('QUIZ CHAMP 2026', margin, 40, { width: contentWidth, align: 'center' });
      
      // Subtitle
      doc.fontSize(16).fillColor('#ffffff').font('Helvetica')
        .text('ADMIT CARD', margin, 85, { width: contentWidth, align: 'center' });
      
      // Decorative line
      doc.moveTo(margin + 150, 115).lineTo(pageWidth - margin - 150, 115)
        .lineWidth(2).strokeColor('#ffffff').stroke();

      // ========== CONTENT SECTION ==========
      let currentY = 170;

      // Photo section (right side)
      const photoX = pageWidth - margin - 140;
      const photoY = currentY;
      const photoWidth = 130;
      const photoHeight = 160;

      if (data.photoUrl) {
        try {
          const photoResponse = await axios.get(data.photoUrl, { responseType: 'arraybuffer' });
          const photoBuffer = Buffer.from(photoResponse.data);
          
          // Photo border with shadow effect
          doc.rect(photoX - 2, photoY - 2, photoWidth + 4, photoHeight + 4).fill('#d2d2d7');
          doc.rect(photoX, photoY, photoWidth, photoHeight).fill('#ffffff');
          
          // Add photo
          doc.image(photoBuffer, photoX + 5, photoY + 5, {
            width: photoWidth - 10,
            height: photoHeight - 10,
            align: 'center',
          });
        } catch (err) {
          console.error('Failed to load photo:', err);
          // Draw placeholder
          doc.rect(photoX, photoY, photoWidth, photoHeight).stroke('#d2d2d7');
          doc.fontSize(12).fillColor('#86868b').font('Helvetica')
            .text('Photo\nUnavailable', photoX, photoY + 65, { width: photoWidth, align: 'center' });
        }
      } else {
        // Placeholder
        doc.rect(photoX, photoY, photoWidth, photoHeight).stroke('#d2d2d7');
        doc.fontSize(12).fillColor('#86868b').font('Helvetica')
          .text('Photo\nUnavailable', photoX, photoY + 65, { width: photoWidth, align: 'center' });
      }

      // ========== PARTICIPANT DETAILS ==========
      const detailsX = margin;
      const detailsWidth = contentWidth - photoWidth - 30;

      const addDetailField = (label: string, value: string, y: number) => {
        // Label
        doc.fontSize(10).fillColor('#86868b').font('Helvetica')
          .text(label.toUpperCase(), detailsX, y);
        
        // Value
        doc.fontSize(14).fillColor('#1d1d1f').font('Helvetica-Bold')
          .text(value, detailsX, y + 16, { width: detailsWidth });
        
        // Underline
        doc.moveTo(detailsX, y + 38).lineTo(detailsX + detailsWidth, y + 38)
          .lineWidth(1).strokeColor('#e5e5e5').stroke();
        
        return y + 50;
      };

      currentY = addDetailField('Roll Number', data.rollNumber, currentY);
      currentY = addDetailField('Participant Name', data.name, currentY);
      currentY = addDetailField('Class', data.class, currentY);
      currentY = addDetailField('Batch Category', 
        data.batchType === 'JUNIOR' ? 'Junior Batch (Classes 1-7)' : 'Senior Batch (Classes 8-12)', 
        currentY);
      currentY = addDetailField('Guardian Name', data.guardianName, currentY);
      currentY = addDetailField('Contact Number', `+91 ${data.mobileNumber}`, currentY);

      // ========== EVENT DETAILS BOX ==========
      currentY = Math.max(currentY, photoY + photoHeight + 30);
      
      const boxY = currentY;
      const boxHeight = 120;
      
      // Box with gradient
      doc.rect(margin, boxY, contentWidth, boxHeight).fill('#f8f9fa');
      doc.rect(margin, boxY, contentWidth, boxHeight).stroke('#d2d2d7');
      
      // Box header
      doc.rect(margin, boxY, contentWidth, 35).fill('#0071e3');
      doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
        .text('EVENT INFORMATION', margin + 15, boxY + 10);
      
      // Event details
      const eventY = boxY + 50;
      doc.fontSize(11).fillColor('#1d1d1f').font('Helvetica');
      
      doc.font('Helvetica-Bold').text('Event: ', margin + 15, eventY, { continued: true })
        .font('Helvetica').text(data.eventName || 'Quiz Champ 2026 Competition');
      
      doc.font('Helvetica-Bold').text('Date: ', margin + 15, eventY + 20, { continued: true })
        .font('Helvetica').text(data.eventDate || 'To be announced');
      
      doc.font('Helvetica-Bold').text('Venue: ', margin + 15, eventY + 40, { continued: true })
        .font('Helvetica').text(data.venue || 'To be announced');

      // ========== INSTRUCTIONS SECTION ==========
      currentY = boxY + boxHeight + 30;
      
      doc.fontSize(13).fillColor('#1d1d1f').font('Helvetica-Bold')
        .text('IMPORTANT INSTRUCTIONS', margin, currentY);
      
      currentY += 25;
      
      const instructions = [
        'Carry this admit card and a valid ID proof on the day of the event',
        'Report to the venue at least 30 minutes before the scheduled time',
        'Mobile phones and electronic devices are strictly prohibited during the quiz',
        'Follow all instructions given by the event organizers and invigilators',
        'Candidates must occupy their assigned seats as per the seating arrangement'
      ];
      
      doc.fontSize(10).fillColor('#1d1d1f').font('Helvetica');
      instructions.forEach((instruction, index) => {
        doc.circle(margin + 5, currentY + 5, 2).fill('#0071e3');
        doc.text(instruction, margin + 15, currentY, { width: contentWidth - 15 });
        currentY += 22;
      });

      // ========== FOOTER SECTION ==========
      const footerY = pageHeight - 120;
      
      // Signature section
      doc.moveTo(pageWidth - margin - 150, footerY).lineTo(pageWidth - margin, footerY)
        .lineWidth(1).strokeColor('#1d1d1f').stroke();
      
      doc.fontSize(9).fillColor('#1d1d1f').font('Helvetica-Bold')
        .text('Authorized Signature', pageWidth - margin - 150, footerY + 10, { width: 150, align: 'center' });

      // Footer bar
      const footerBarY = pageHeight - 70;
      doc.rect(0, footerBarY, pageWidth, 70).fill('#f5f5f7');
      
      // Organization info
      doc.fontSize(11).fillColor('#1d1d1f').font('Helvetica-Bold')
        .text('Organized by Satyalok Foundation', margin, footerBarY + 15, { width: contentWidth, align: 'center' });
      
      doc.fontSize(9).fillColor('#86868b').font('Helvetica')
        .text('For queries: support@quizchamp.com | www.quizchamp.com', margin, footerBarY + 35, { width: contentWidth, align: 'center' });

      // Bottom decorative border
      doc.rect(0, pageHeight - 8, pageWidth, 8).fill('#0071e3');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
