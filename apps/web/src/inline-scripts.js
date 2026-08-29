import { createHash } from 'node:crypto';

/**
 * The one script that has to run inline. It reads the stored theme and applies
 * it before first paint, so a stored light theme never flashes dark; deferring
 * it to the bundle would put the flash back.
 *
 * It lives here rather than in the layout because the Content-Security-Policy
 * has to name its hash, and a policy computed from a copy of the source would
 * go stale the first time someone edited the other one.
 */
export const THEME_SCRIPT =
  "try{var t=localStorage.getItem('d3vices:theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}";

/** The CSP source expression that allows exactly the script above and nothing else. */
export const THEME_SCRIPT_HASH = `'sha256-${createHash('sha256').update(THEME_SCRIPT).digest('base64')}'`;
