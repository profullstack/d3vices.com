# d3vices.com

Open-source hardware diagnostics that run on your device. Test your microphone,
camera, speakers, screen sharing, display, keyboard, mouse, gamepad, MIDI,
sensors and network — in a browser tab, as an installed PWA, or as a native
desktop app for Windows, macOS and Linux.

**No account. No upload. No tracking.** Every test runs in the page. The only
bytes that reach the server are the page itself and the network test, which
exists precisely to move bytes.

- Live: <https://d3vices.com>
- Licence: MIT

## Why

A device tester asks for your camera, your microphone and your location. You
should be able to read what it does with them before you press start. That is
the whole argument for this being open source rather than another closed box.

It is also a real progressive web app: install it once and every test keeps
working with the network unplugged, which matters because a broken network is
one of the things you came here to diagnose.

## What is in it

24 tests, grouped:

| Group | Tests |
| --- | --- |
| Audio & video | microphone, speaker, camera, screen share |
| Display | display & dead pixel, screen information |
| Input | keyboard, mouse, touch, gamepad, MIDI |
| Performance lab | click speed (CPS), Kohi, jitter, reaction time, scroll speed |
| Sensors & radios | network, battery, location, motion, ambient light, vibration, Bluetooth |
| System | full capability report |

## Stack

The house stack, same shape as `tipoffwatch.com`:

- **Bun 1.3** workspaces
- **Hono** with JSX server-side rendering — no client framework
- **Docker** on **Railway**, deployed from `master`
- **Biome** for lint and format, `bun test` for tests

There is deliberately **no database and no Redis**. Nothing about this app has
server-side state: every page is static SSR and every measurement happens in the
browser. Adding Postgres would buy nothing to store.

## Layout

```
apps/
  web/                 Hono SSR site — routes, pages, static assets, PWA manifest, service worker
  desktop/             Electron app — loopback server, permission handlers, native bridges
packages/
  tests/               The test engine. One module per test, framework-free, shared by web and desktop
  config/              Environment reading, in one place
test/                  bun test suites, plus browser and desktop smoke tests
```

`packages/tests` is the important one. Each test is a module exporting
`supported()` and `mount(root)`; `mount` returns its own cleanup function. The
server renders the copy that needs to be indexable and leaves a
`<div data-test="…">` behind, and the client mounts the matching module into it.
There is exactly one implementation of every test, and the desktop app runs it
unmodified.

## Development

```bash
bun install
bun run dev            # http://localhost:8080
bun test               # unit tests
bun run lint           # biome
bun test/browser-smoke.js   # loads all 24 pages in real Chromium, fails on any console error
```

Building the site and the desktop app:

```bash
bun run build:site     # bundles the client and exports every page to dist/site
bun run desktop        # stages dist/site into the app and launches Electron
bun run desktop:dist   # packages installers into release/
```

### Requirements

Bun 1.3+. The desktop app additionally needs the usual Electron system
libraries (GTK 3, NSS, libatk); the browser smoke test needs a Chromium binary,
found automatically or pointed at with `CHROME_PATH`.

## How the desktop app works

Electron serves the exported site from a **loopback HTTP server**, not from
`file://`. A `file://` origin is not a secure context for several of the APIs
these tests exist to exercise, and it has no working same-origin fetch;
`http://127.0.0.1` is a secure context, so the packaged app runs the same code
the website does.

The main process supplies the things a browser cannot:

- `setDisplayMediaRequestHandler` — since Electron 17, `getDisplayMedia` does
  nothing at all without one.
- `select-bluetooth-device`, `select-hid-device`, `select-usb-device` — without
  a handler these promises never settle, and the test simply hangs, which reads
  as broken hardware.
- `systemPreferences.askForMediaAccess` on macOS — the browser-level prompt
  alone is not enough there.
- `WebRTCPipeWireCapturer` on Linux, or screen capture on Wayland returns black.
- Native system, display and disk information over a narrow, read-only preload
  bridge (`window.d3vices`).

Desktop builds are produced only by a `v*` tag — merging to `master` ships the
website, never the app.

### Packaging note for Linux

`electron-builder`'s stock `.deb` postinst decides how to configure the Chromium
sandbox by running `unshare --user true` **as root**, during install. On Ubuntu
24.04+ `kernel.apparmor_restrict_unprivileged_userns=1` restricts *unprivileged*
user namespaces only, and root is exempt — so the probe succeeds, the SUID
helper is left non-SUID, and the app aborts for the ordinary user who launches
it. `apps/desktop/resources/after-install.sh` probes as `nobody` instead and
installs an AppArmor profile. Prefer the `.deb` over the AppImage on Ubuntu: a
FUSE squashfs mount is `nosuid`, so the SUID helper can never work inside an
AppImage whatever the mode bits say.

## Contributing

Issues and pull requests welcome. Adding a test means:

1. A module in `packages/tests/src/tests/`.
2. An entry in `packages/tests/src/registry.js`.
3. An import in `packages/tests/src/index.js`.
4. Its path added to the precache list in `apps/web/public/sw.js` — there is a
   test that fails if you forget, because otherwise the omission is invisible
   until someone goes offline.

## Licence

MIT © Profullstack, Inc.
