import { startSolPriceUpdater } from './solPrice.service.js';

/**
 * Initialize all cache-related functions.
 */
export function initializeCacheFunctions(): void {
  startSolPriceUpdater();
}
