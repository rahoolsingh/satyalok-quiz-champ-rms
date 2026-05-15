"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.generateAdmitCardEmail = generateAdmitCardEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = null;
function getTransporter() {
    if (transporter)
        return transporter;
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    if (!host || !user || !pass) {
        throw new Error('Email configuration missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD');
    }
    transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
    return transporter;
}
async function sendEmail(options) {
    const transport = getTransporter();
    const from = process.env.EMAIL_FROM || 'Quiz Champ 2026 <noreply@satyalok.in>';
    await transport.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
    });
}
function generateAdmitCardEmail(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1d1d1f; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 40px 20px; }
    .success-icon { text-align: center; font-size: 64px; margin-bottom: 20px; }
    .message { text-align: center; margin-bottom: 30px; }
    .message h2 { color: #1d1d1f; font-size: 24px; margin: 0 0 12px; }
    .message p { color: #86868b; font-size: 16px; margin: 0; }
    .details { background-color: #f5f5f7; border-radius: 12px; padding: 24px; margin: 30px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d2d2d7; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #86868b; font-size: 14px; }
    .detail-value { color: #1d1d1f; font-size: 14px; font-weight: 600; }
    .cta { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 14px 32px; background-color: #0071e3; color: #ffffff; text-decoration: none; border-radius: 24px; font-weight: 600; font-size: 16px; }
    .footer { background-color: #f5f5f7; padding: 30px 20px; text-align: center; }
    .footer p { color: #86868b; font-size: 12px; margin: 4px 0; }
    .footer a { color: #0071e3; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 Quiz Champ 2026</h1>
      <p>Registration Successful</p>
    </div>
    
    <div class="content">
      <div class="success-icon">✅</div>
      
      <div class="message">
        <h2>Congratulations, ${data.name}!</h2>
        <p>Your registration has been confirmed. Your admit card is attached to this email.</p>
      </div>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Roll Number</span>
          <span class="detail-value">${data.rollNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Batch</span>
          <span class="detail-value">${data.batch === 'JUNIOR' ? 'Junior Batch (5-10)' : 'Senior Batch (10+)'}</span>
        </div>
        ${data.eventDate ? `
        <div class="detail-row">
          <span class="detail-label">Event Date</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="cta">
        <p style="color: #86868b; font-size: 14px; margin-bottom: 16px;">
          Please keep your admit card safe and bring it on the day of the event.
        </p>
      </div>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>Important:</strong> Please arrive 30 minutes before the scheduled time. Carry a valid ID proof along with this admit card.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Quiz Champ 2026</strong></p>
      <p>Organized by Satyalok Foundation</p>
      <p style="margin-top: 16px;">
        Need help? Contact us at <a href="mailto:contact@satyalok.in">contact@satyalok.in</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
//# sourceMappingURL=email.js.map