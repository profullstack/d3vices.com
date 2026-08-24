import { CLICK_RANKS, clickLab } from './click-lab.js';

export const id = 'cps';
export const supported = () => true;
export const mount = clickLab({
  storageKey: 'd3vices:cps-history',
  durations: [1, 5, 10, 30, 60],
  defaultDuration: 5,
  ranks: CLICK_RANKS,
});
