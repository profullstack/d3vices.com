/**
 * Client entry point. The server renders the copy that needs to be indexable
 * and leaves one <div data-test="…"> behind; this finds it and mounts the
 * matching module. Test modules are imported statically so the bundle is one
 * file that a service worker can cache whole — a device diagnostic has to keep
 * working when the network is the thing that is broken.
 */
import { mountMachine, mountStatusBar } from './machine.js';
import * as ambientLight from './tests/ambient-light.js';
import * as battery from './tests/battery.js';
import * as bluetooth from './tests/bluetooth.js';
import * as camera from './tests/camera.js';
import * as cps from './tests/cps.js';
import * as display from './tests/display.js';
import * as gamepad from './tests/gamepad.js';
import * as geolocation from './tests/geolocation.js';
import * as jitter from './tests/jitter.js';
import * as keyboard from './tests/keyboard.js';
import * as kohi from './tests/kohi.js';
import * as microphone from './tests/microphone.js';
import * as midi from './tests/midi.js';
import * as motion from './tests/motion.js';
import * as mouse from './tests/mouse.js';
import * as network from './tests/network.js';
import * as reaction from './tests/reaction.js';
import * as screenInfo from './tests/screen-info.js';
import * as screenShare from './tests/screen-share.js';
import * as scroll from './tests/scroll.js';
import * as speaker from './tests/speaker.js';
import * as system from './tests/system.js';
import * as touch from './tests/touch.js';
import * as vibration from './tests/vibration.js';

const MODULES = {
  'ambient-light': ambientLight,
  battery,
  bluetooth,
  camera,
  cps,
  display,
  gamepad,
  geolocation,
  jitter,
  keyboard,
  kohi,
  microphone,
  midi,
  motion,
  mouse,
  network,
  reaction,
  'screen-info': screenInfo,
  'screen-share': screenShare,
  scroll,
  speaker,
  system,
  touch,
  vibration,
};

let cleanup = null;

function mountTest() {
  const host = document.querySelector('[data-test]');
  if (!host) return;
  const module = MODULES[host.dataset.test];
  if (!module) {
    host.append(
      Object.assign(document.createElement('p'), {
        className: 'note note-error',
        textContent: `Unknown test: ${host.dataset.test}`,
      }),
    );
    return;
  }
  cleanup?.();
  host.textContent = '';
  try {
    cleanup = module.mount(host) ?? null;
  } catch (error) {
    console.error('[d3vices] test failed to mount', error);
    host.append(
      Object.assign(document.createElement('p'), {
        className: 'note note-error',
        textContent: `This test could not start: ${error?.message ?? error}`,
      }),
    );
  }
}

function initTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const stored = (() => {
    try {
      return localStorage.getItem('d3vices:theme');
    } catch {
      return null;
    }
  })();
  if (stored) document.documentElement.dataset.theme = stored;
  toggle?.addEventListener('click', () => {
    const current =
      document.documentElement.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('d3vices:theme', next);
    } catch {
      /* storage disabled */
    }
  });
}

function initNav() {
  const button = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  button?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(Boolean(open)));
  });
}

/**
 * The install prompt. Chromium fires beforeinstallprompt and expects the page
 * to hold the event until the user asks; every other browser ignores this and
 * the button stays hidden.
 */
function initInstall() {
  const button = document.querySelector('[data-install]');
  if (!button) return;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') button.hidden = true;
    deferred = null;
  });
  window.addEventListener('appinstalled', () => {
    button.hidden = true;
  });
}

function initServiceWorker() {
  // The desktop build loads from file:// and has no network to go offline from.
  if (!('serviceWorker' in navigator) || window.d3vices?.isDesktop) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[d3vices] service worker registration failed', error);
    });
  });
}

function initOfflineBanner() {
  const banner = document.querySelector('[data-offline]');
  if (!banner) return;
  const update = () => {
    banner.hidden = navigator.onLine;
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/**
 * The desktop build serves the same pages, so the shell difference is a flag on
 * the document root and CSS — never a second set of components to keep in sync.
 */
function initDesktop() {
  if (!window.d3vices?.isDesktop) return;
  document.documentElement.dataset.desktop = 'true';
  mountStatusBar();
}

function mountMachinePage() {
  const host = document.querySelector('[data-machine]');
  if (host) mountMachine(host);
}

function boot() {
  initDesktop();
  initTheme();
  initNav();
  initInstall();
  initOfflineBanner();
  initServiceWorker();
  mountTest();
  mountMachinePage();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.addEventListener('pagehide', () => cleanup?.());

export { MODULES };
