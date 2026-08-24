import { CLICK_RANKS, clickLab } from './click-lab.js';

export const id = 'kohi';
export const supported = () => true;
// The Kohi test is a fixed ten seconds. That is the whole point of it.
export const mount = clickLab({
  storageKey: 'd3vices:kohi-history',
  durations: [10],
  defaultDuration: 10,
  ranks: CLICK_RANKS,
});
