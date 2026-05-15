import { PortalConfiguration, PortalState } from '../types';
export declare function computePortalState(config: PortalConfiguration, now?: Date): PortalState;
export declare function areResultsPublished(config: PortalConfiguration, now?: Date): boolean;
export declare function getPortalConfig(): Promise<PortalConfiguration | null>;
//# sourceMappingURL=portalState.d.ts.map