import { clickLab } from './click-lab.js';

export const id = 'jitter';
export const supported = () => true;
export const mount = clickLab({
  storageKey: 'd3vices:jitter-history',
  durations: [5, 10],
  defaultDuration: 10,
  showConsistency: true,
  ranks: [
    { min: 14, name: 'Inhuman — check for double-firing' },
    { min: 12, name: 'Elite jitter' },
    { min: 10, name: 'Strong jitter' },
    { min: 8, name: 'Developing' },
    { min: 0, name: 'Warming up' },
  ],
});
