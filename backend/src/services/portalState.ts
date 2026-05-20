import { PortalConfig } from '../db/models';
import { PortalConfiguration, PortalState } from '../types';

export function computePortalState(config: PortalConfiguration, now: Date = new Date()): PortalState {
  if (config.manualStatus !== 'AUTO') {
    switch (config.manualStatus) {
      case 'COUNTDOWN': return 'COUNTDOWN';
      case 'OPEN': return 'OPEN';
      case 'CLOSED': return 'CLOSED';
    }
  }
  if (now < config.openingDate) return 'COUNTDOWN';
  if (now >= config.openingDate && now <= config.closingDate) return 'OPEN';
  return 'CLOSED';
}

export function areResultsPublished(config: PortalConfiguration, now: Date = new Date()): boolean {
  if (!config.resultPublicationDate) return false;
  return now >= config.resultPublicationDate;
}

export async function getPortalConfig(): Promise<PortalConfiguration | null> {
  const doc = await PortalConfig.findOne().sort({ createdAt: -1 });
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    openingDate: doc.openingDate,
    closingDate: doc.closingDate,
    manualStatus: doc.manualStatus,
    resultPublicationDate: doc.resultPublicationDate,
    feeJunior: doc.feeJunior ?? 100,
    feeSenior: doc.feeSenior ?? 150,
    eventDate: doc.eventDate,
    eventTime: doc.eventTime,
    venue: doc.venue,
    venueMapUrl: doc.venueMapUrl,
    prizeDistributionDate: doc.prizeDistributionDate,
    prizeDistributionVenue: doc.prizeDistributionVenue,
    prizeDistributionMapUrl: doc.prizeDistributionMapUrl,
    whatsappSupportName: doc.whatsappSupportName,
    whatsappSupportNumber: doc.whatsappSupportNumber,
    callContactName: doc.callContactName,
    callContactNumber: doc.callContactNumber,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
