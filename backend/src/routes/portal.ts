import { Router, Request, Response } from 'express';
import { getPortalConfig, computePortalState, areResultsPublished } from '../services/portalState';
import { SliderImage } from '../db/models';

export const portalRouter = Router();

// GET /api/portal/status
portalRouter.get('/status', async (_req: Request, res: Response) => {
  try {
    const config = await getPortalConfig();
    if (!config) {
      return res.status(503).json({ error: 'Portal not configured' });
    }
    const state = computePortalState(config);
    const resultsPublished = areResultsPublished(config);
    return res.json({
      state,
      openingDate: config.openingDate,
      closingDate: config.closingDate,
      resultsPublished,
      resultPublicationDate: config.resultPublicationDate,
      eventDate: config.eventDate,
      eventTime: config.eventTime,
      reportingTime: config.reportingTime,
      examTime: config.examTime,
      venue: config.venue,
      prizeDistributionDate: config.prizeDistributionDate,
      prizeDistributionTime: config.prizeDistributionTime,
      prizeDistributionVenue: config.prizeDistributionVenue,
      prizeDistributionMapUrl: config.prizeDistributionMapUrl,
      whatsappSupportName: config.whatsappSupportName,
      whatsappSupportNumber: config.whatsappSupportNumber,
      callContactName: config.callContactName,
      callContactNumber: config.callContactNumber,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get portal status' });
  }
});

// GET /api/portal/slider-images
portalRouter.get('/slider-images', async (_req: Request, res: Response) => {
  try {
    const images = await SliderImage.find().sort({ displayOrder: 1 });
    return res.json(
      images.map((img) => ({
        id: img._id.toString(),
        imageUrl: img.imageUrl,
        displayOrder: img.displayOrder,
        createdAt: img.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to get slider images' });
  }
});
