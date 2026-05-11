import { Router, Request, Response } from 'express';
import { generateAdmitCardPDF } from '../services/admitCardPdf';
import fs from 'fs';
import path from 'path';

export const testAdmitCardRouter = Router();

/**
 * Test route to generate admit card PDF
 * GET /api/test/admit-card
 * 
 * This route reads sample data from test-data/sample-admit-card.json
 * and generates a PDF admit card for testing and styling purposes.
 */
testAdmitCardRouter.get('/admit-card', async (req: Request, res: Response) => {
  try {
    // Read sample data from JSON file
    const sampleDataPath = path.join(__dirname, '../test-data/sample-admit-card.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

    console.log('[Test Admit Card] Generating PDF with data:', sampleData);

    // Generate PDF
    const pdfBuffer = await generateAdmitCardPDF(sampleData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="admit-card-${sampleData.rollNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Test Admit Card] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate admit card', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Test route to generate admit card with custom data
 * POST /api/test/admit-card
 * 
 * Send JSON data in the request body to generate a custom admit card
 */
testAdmitCardRouter.post('/admit-card', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Validate required fields
    const requiredFields = ['rollNumber', 'name', 'class', 'batchType', 'guardianName', 'mobileNumber'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    console.log('[Test Admit Card] Generating PDF with custom data:', data);

    // Generate PDF
    const pdfBuffer = await generateAdmitCardPDF(data);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="admit-card-${data.rollNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[Test Admit Card] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate admit card', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Get sample data template
 * GET /api/test/admit-card/sample
 */
testAdmitCardRouter.get('/admit-card/sample', (req: Request, res: Response) => {
  try {
    const sampleDataPath = path.join(__dirname, '../test-data/sample-admit-card.json');
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));
    res.json(sampleData);
  } catch (error) {
    console.error('[Test Admit Card] Error reading sample:', error);
    res.status(500).json({ error: 'Failed to read sample data' });
  }
});
