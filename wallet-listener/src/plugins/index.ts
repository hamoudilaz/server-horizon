import { startSolPriceUpdater } from './sol-price.plugin.js';

export function pluginsLoader() {
  startSolPriceUpdater();
}
