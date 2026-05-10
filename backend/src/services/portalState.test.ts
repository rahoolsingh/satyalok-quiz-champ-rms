import { computePortalState, areResultsPublished } from './portalState';
import { PortalConfiguration } from '../types';

function makeConfig(overrides: Partial<PortalConfiguration> = {}): PortalConfiguration {
  const now = new Date();
  return {
    id: 'test-id',
    openingDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    closingDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    manualStatus: 'AUTO',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('computePortalState', () => {
  it('returns COUNTDOWN when current date is before opening date', () => {
    const config = makeConfig();
    const beforeOpening = new Date(config.openingDate.getTime() - 1000);
    expect(computePortalState(config, beforeOpening)).toBe('COUNTDOWN');
  });

  it('returns OPEN when current date is between opening and closing', () => {
    const config = makeConfig();
    const duringOpen = new Date(config.openingDate.getTime() + 1000);
    expect(computePortalState(config, duringOpen)).toBe('OPEN');
  });

  it('returns CLOSED when current date is after closing date', () => {
    const config = makeConfig();
    const afterClose = new Date(config.closingDate.getTime() + 1000);
    expect(computePortalState(config, afterClose)).toBe('CLOSED');
  });

  it('respects manual COUNTDOWN override regardless of date', () => {
    const config = makeConfig({ manualStatus: 'COUNTDOWN' });
    const duringOpen = new Date(config.openingDate.getTime() + 1000);
    expect(computePortalState(config, duringOpen)).toBe('COUNTDOWN');
  });

  it('respects manual OPEN override regardless of date', () => {
    const config = makeConfig({ manualStatus: 'OPEN' });
    const beforeOpening = new Date(config.openingDate.getTime() - 1000);
    expect(computePortalState(config, beforeOpening)).toBe('OPEN');
  });

  it('respects manual CLOSED override regardless of date', () => {
    const config = makeConfig({ manualStatus: 'CLOSED' });
    const duringOpen = new Date(config.openingDate.getTime() + 1000);
    expect(computePortalState(config, duringOpen)).toBe('CLOSED');
  });

  it('uses AUTO mode when manualStatus is AUTO', () => {
    const config = makeConfig({ manualStatus: 'AUTO' });
    const beforeOpening = new Date(config.openingDate.getTime() - 1000);
    expect(computePortalState(config, beforeOpening)).toBe('COUNTDOWN');
  });
});

describe('areResultsPublished', () => {
  it('returns false when no publication date is set', () => {
    const config = makeConfig({ resultPublicationDate: undefined });
    expect(areResultsPublished(config)).toBe(false);
  });

  it('returns false when publication date is in the future', () => {
    const future = new Date(Date.now() + 10000);
    const config = makeConfig({ resultPublicationDate: future });
    expect(areResultsPublished(config, new Date())).toBe(false);
  });

  it('returns true when publication date has passed', () => {
    const past = new Date(Date.now() - 10000);
    const config = makeConfig({ resultPublicationDate: past });
    expect(areResultsPublished(config, new Date())).toBe(true);
  });
});
