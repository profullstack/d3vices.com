/**
 * The catalogue of tests. Pure data — no DOM, no browser API access — so the
 * Hono server can import it to render navigation, routes, the sitemap and
 * JSON-LD, and the Electron main process can import it to build its menu.
 *
 * `platforms` is what the test can work on at all, not a promise that it will:
 * whether a given browser exposes the API is decided at runtime by the module's
 * own `supported()`.
 */

export const GROUPS = [
  { id: 'av', name: 'Audio & video' },
  { id: 'display', name: 'Display' },
  { id: 'input', name: 'Input' },
  { id: 'lab', name: 'Performance lab' },
  { id: 'sensors', name: 'Sensors & radios' },
  { id: 'system', name: 'System' },
];

export const TESTS = [
  {
    id: 'microphone',
    slug: 'microphone',
    name: 'Microphone test',
    short: 'Microphone',
    group: 'av',
    blurb:
      'Check that your mic is heard, see a live waveform, watch the input level and record a short clip to play back.',
    description:
      'Test your microphone in the browser. See a live waveform and volume meter, pick between input devices, and record a few seconds to hear exactly what the other side hears.',
    apis: ['getUserMedia', 'AudioContext', 'MediaRecorder'],
    permissions: ['microphone'],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['mic test', 'microphone test online', 'test my mic', 'audio input test'],
  },
  {
    id: 'speaker',
    slug: 'speaker',
    name: 'Speaker test',
    short: 'Speaker',
    group: 'av',
    blurb:
      'Play a tone through the left and right channel independently, sweep the audible range and check for a blown driver.',
    description:
      'Test your speakers or headphones. Play left, right and both channels separately, run a frequency sweep from 20 Hz to 20 kHz, and check stereo wiring without installing anything.',
    apis: ['AudioContext'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['speaker test', 'left right speaker test', 'stereo test', 'headphone test'],
  },
  {
    id: 'camera',
    slug: 'camera',
    name: 'Camera test',
    short: 'Camera',
    group: 'av',
    blurb:
      'See your webcam live, read the resolution and frame rate it actually delivers, and switch between cameras.',
    description:
      'Test your webcam in the browser. Preview the live feed, read the real resolution and frame rate the camera negotiates, switch between front and rear or between multiple cameras, and take a still frame.',
    apis: ['getUserMedia'],
    permissions: ['camera'],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['webcam test', 'camera test online', 'test my camera'],
  },
  {
    id: 'screen-share',
    slug: 'screen-share',
    name: 'Screen share test',
    short: 'Screen share',
    group: 'av',
    blurb:
      'Confirm screen sharing works before a call, and see the resolution and frame rate the capture actually produces.',
    description:
      'Test screen sharing before a meeting. Pick a screen, window or tab, confirm the browser can capture it, and read back the exact resolution and frame rate that would be sent.',
    apis: ['getDisplayMedia'],
    permissions: ['display-capture'],
    platforms: ['web', 'desktop'],
    keywords: ['screen share test', 'test screen sharing', 'presentation test'],
  },
  {
    id: 'display',
    slug: 'display',
    name: 'Display & dead pixel test',
    short: 'Display',
    group: 'display',
    blurb:
      'Full-screen solid colours, gradients and grids to find dead pixels, backlight bleed and colour banding.',
    description:
      'Find dead pixels, stuck subpixels, backlight bleed and colour banding. Full-screen solid colours, greyscale ramps, RGB sweeps and geometry grids, driven entirely from the keyboard.',
    apis: ['Fullscreen API'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['dead pixel test', 'monitor test', 'screen test', 'stuck pixel'],
  },
  {
    id: 'screen-info',
    slug: 'screen-info',
    name: 'Screen information',
    short: 'Screen info',
    group: 'display',
    blurb:
      'Resolution, device pixel ratio, colour depth, colour gamut, refresh rate, orientation and safe-area insets.',
    description:
      'Read everything the browser knows about your display: resolution, device pixel ratio, colour depth, supported colour gamut, HDR capability, measured refresh rate, orientation and safe-area insets.',
    apis: ['screen', 'matchMedia', 'requestAnimationFrame'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['screen resolution test', 'what is my resolution', 'refresh rate test', 'dpi test'],
  },
  {
    id: 'keyboard',
    slug: 'keyboard',
    name: 'Keyboard test',
    short: 'Keyboard',
    group: 'input',
    blurb:
      'Press every key and watch it light up. ANSI, ISO and JIS layouts, with rollover and ghosting detection.',
    description:
      'Test every key on your keyboard. Keys light up as you press them and stay marked once seen, so you can find a dead switch. Includes ANSI, ISO and JIS layouts, modifier and lock state, key repeat rate and n-key rollover.',
    apis: ['KeyboardEvent'],
    permissions: [],
    platforms: ['web', 'desktop'],
    keywords: ['keyboard test', 'key tester', 'dead key test', 'nkro test'],
  },
  {
    id: 'mouse',
    slug: 'mouse',
    name: 'Mouse test',
    short: 'Mouse',
    group: 'input',
    blurb:
      'Every button including back and forward, scroll in both axes, double-click timing and a polling-rate estimate.',
    description:
      'Test every mouse button, both scroll axes, double-click timing and pointer movement. Estimates your polling rate from the interval between pointer events, and flags a double-click that fires from a single physical press.',
    apis: ['PointerEvent', 'WheelEvent'],
    permissions: [],
    platforms: ['web', 'desktop'],
    keywords: ['mouse test', 'mouse button test', 'polling rate test', 'double click test'],
  },
  {
    id: 'touch',
    slug: 'touch',
    name: 'Touchscreen test',
    short: 'Touch',
    group: 'input',
    blurb:
      'Draw with up to ten fingers at once, see pressure and contact size, and find dead zones in the digitiser.',
    description:
      'Test your touchscreen or trackpad. Draw with every finger at once, see how many simultaneous contacts the digitiser reports, read pressure and contact size where the device provides them, and sweep for dead zones.',
    apis: ['PointerEvent', 'Touch Events'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['touch screen test', 'multi touch test', 'digitizer test'],
  },
  {
    id: 'gamepad',
    slug: 'gamepad',
    name: 'Gamepad test',
    short: 'Gamepad',
    group: 'input',
    blurb: 'Every button and axis of a connected controller, live, with stick drift measurement and rumble.',
    description:
      'Test a game controller in the browser. Every button and analogue axis is shown live, with a stick-drift readout that tells you whether a resting stick is actually centred, plus a rumble test where the pad supports it.',
    apis: ['Gamepad API', 'Vibration Actuator'],
    permissions: [],
    platforms: ['web', 'desktop'],
    keywords: ['gamepad test', 'controller test', 'stick drift test', 'xbox controller test'],
  },
  {
    id: 'midi',
    slug: 'midi',
    name: 'MIDI test',
    short: 'MIDI',
    group: 'input',
    blurb: 'See notes, velocity, CC and pitch-bend from any connected MIDI controller on a live piano roll.',
    description:
      'Test a MIDI controller or keyboard. Connected inputs and outputs are listed, notes light up on a piano roll with velocity, and every control change, pitch bend and clock message is logged as it arrives.',
    apis: ['Web MIDI'],
    permissions: ['midi'],
    platforms: ['web', 'desktop'],
    keywords: ['midi test', 'midi monitor', 'midi keyboard test'],
  },
  {
    id: 'cps',
    slug: 'click-speed-test',
    name: 'Click speed test (CPS)',
    short: 'Click speed',
    group: 'lab',
    blurb:
      'How many clicks per second can you land? 1, 5, 10, 30 and 60 second runs with a saved personal best.',
    description:
      'Measure your clicks per second. Choose a 1, 5, 10, 30 or 60 second run, click as fast as you can, and see your CPS, total clicks and rank. Your history stays on your device.',
    apis: ['PointerEvent', 'performance.now'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['cps test', 'click speed test', 'clicks per second', 'click test'],
  },
  {
    id: 'kohi',
    slug: 'kohi-click-test',
    name: 'Kohi click test',
    short: 'Kohi test',
    group: 'lab',
    blurb: 'The 10-second Minecraft PvP standard, scored the way the Kohi server did it.',
    description:
      'The Kohi click test: a fixed 10 second run scored in clicks per second, the benchmark Minecraft PvP players have used for years. The clock starts on your first click, not on a countdown.',
    apis: ['PointerEvent', 'performance.now'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['kohi click test', 'minecraft click test', '10 second click test'],
  },
  {
    id: 'jitter',
    slug: 'jitter-click-test',
    name: 'Jitter click test',
    short: 'Jitter click',
    group: 'lab',
    blurb: 'Measure a jitter-clicking burst, and see the consistency of your interval, not just the peak.',
    description:
      'Test your jitter clicking. As well as clicks per second, this reports the standard deviation of the gap between clicks, which is what separates a sustainable jitter from a lucky burst.',
    apis: ['PointerEvent', 'performance.now'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['jitter click test', 'jitter clicking', 'butterfly click test'],
  },
  {
    id: 'reaction',
    slug: 'reaction-time-test',
    name: 'Reaction time test',
    short: 'Reaction time',
    group: 'lab',
    blurb: 'Wait for green, then click. Five rounds, with your median and best kept on your device.',
    description:
      'Measure your reaction time. Wait for the panel to turn green, then click or press a key as fast as you can. Five rounds give a median rather than one lucky number, and clicking early is caught.',
    apis: ['performance.now'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['reaction time test', 'reflex test', 'human benchmark'],
  },
  {
    id: 'scroll',
    slug: 'scroll-speed-test',
    name: 'Scroll speed test',
    short: 'Scroll speed',
    group: 'lab',
    blurb: 'How fast can you spin the wheel? Measures lines per second and normalises across wheel modes.',
    description:
      'Measure your scroll speed in lines per second. Wheel deltas are normalised across pixel, line and page modes, so a trackpad, a notched wheel and a free-spinning wheel are compared on the same scale.',
    apis: ['WheelEvent', 'performance.now'],
    permissions: [],
    platforms: ['web', 'desktop'],
    keywords: ['scroll test', 'scroll speed test', 'mouse wheel test'],
  },
  {
    id: 'network',
    slug: 'network',
    name: 'Network test',
    short: 'Network',
    group: 'sensors',
    blurb:
      'Latency, jitter, download and upload measured against a real endpoint, plus what the browser reports.',
    description:
      'Test your connection. Round-trip latency and jitter from repeated timed probes, download and upload throughput measured against a sized endpoint, and the effective connection type the browser reports.',
    apis: ['fetch', 'performance.now', 'NetworkInformation'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['internet speed test', 'network test', 'latency test', 'jitter test'],
  },
  {
    id: 'battery',
    slug: 'battery',
    name: 'Battery test',
    short: 'Battery',
    group: 'sensors',
    blurb: 'Charge level, charging state and the time remaining the browser estimates, updated live.',
    description:
      'Read your battery status: charge level, whether it is charging, and the charging or discharging time the browser estimates. Updates live as the state changes.',
    apis: ['Battery Status API'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['battery test', 'battery health', 'battery status'],
  },
  {
    id: 'geolocation',
    slug: 'geolocation',
    name: 'Location test',
    short: 'Location',
    group: 'sensors',
    blurb: 'Latitude, longitude, accuracy, altitude, heading and speed, watched live as the fix improves.',
    description:
      'Test location services. Shows latitude, longitude, reported accuracy, altitude, heading and speed, and keeps watching so you can see the fix tighten as more sources come in.',
    apis: ['Geolocation'],
    permissions: ['geolocation'],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['gps test', 'location test', 'geolocation test'],
  },
  {
    id: 'motion',
    slug: 'motion-sensors',
    name: 'Motion sensor test',
    short: 'Motion',
    group: 'sensors',
    blurb: 'Gyroscope, accelerometer and compass, with a live 3D orientation cube.',
    description:
      'Test the gyroscope, accelerometer and magnetometer in your phone or tablet. Orientation drives a live cube, raw acceleration and rotation rates are graphed, and iOS permission is requested properly on a user gesture.',
    apis: ['DeviceOrientationEvent', 'DeviceMotionEvent'],
    permissions: ['accelerometer', 'gyroscope', 'magnetometer'],
    platforms: ['web', 'mobile'],
    keywords: ['gyroscope test', 'accelerometer test', 'compass test', 'motion sensor'],
  },
  {
    id: 'ambient-light',
    slug: 'ambient-light',
    name: 'Ambient light test',
    short: 'Ambient light',
    group: 'sensors',
    blurb: 'Read the ambient light sensor in lux, where the browser exposes one.',
    description:
      'Read your ambient light sensor in lux. Supported on Chromium with the sensor permission granted; the test says plainly when the browser has no sensor to read rather than pretending it failed.',
    apis: ['AmbientLightSensor'],
    permissions: ['ambient-light-sensor'],
    platforms: ['web', 'mobile'],
    keywords: ['ambient light sensor', 'lux meter', 'light sensor test'],
  },
  {
    id: 'vibration',
    slug: 'vibration',
    name: 'Vibration test',
    short: 'Vibration',
    group: 'sensors',
    blurb: 'Fire single buzzes and patterns through the vibration motor.',
    description:
      'Test the vibration motor on a phone or tablet. Fire a short buzz, a long buzz or a pattern, and confirm the haptics work. Desktop browsers accept the call and do nothing, which the test tells you.',
    apis: ['Vibration API'],
    permissions: [],
    platforms: ['web', 'mobile'],
    keywords: ['vibration test', 'haptic test', 'phone vibration'],
  },
  {
    id: 'bluetooth',
    slug: 'bluetooth',
    name: 'Bluetooth test',
    short: 'Bluetooth',
    group: 'sensors',
    blurb: 'Scan for nearby Bluetooth LE devices and read their advertised services.',
    description:
      'Check that Web Bluetooth works and your adapter can see devices. Opens the browser chooser, connects to what you pick, and lists the GATT services it advertises.',
    apis: ['Web Bluetooth'],
    permissions: ['bluetooth'],
    platforms: ['web', 'desktop'],
    keywords: ['bluetooth test', 'web bluetooth', 'ble scanner'],
  },
  {
    id: 'system',
    slug: 'system',
    name: 'System report',
    short: 'System',
    group: 'system',
    blurb:
      'Browser, engine, platform, CPU cores, memory, GPU renderer and the Web APIs this browser actually exposes.',
    description:
      'A full report of what this browser and machine can do: engine and version, platform, logical CPU cores, device memory, GPU vendor and renderer, storage quota, and a checked list of every device API the other tests depend on.',
    apis: ['navigator', 'WebGL', 'StorageManager'],
    permissions: [],
    platforms: ['web', 'desktop', 'mobile'],
    keywords: ['browser test', 'system info', 'what browser am i using', 'gpu test'],
  },
];

export const TEST_BY_ID = Object.fromEntries(TESTS.map((t) => [t.id, t]));
export const TEST_BY_SLUG = Object.fromEntries(TESTS.map((t) => [t.slug, t]));

export function testsInGroup(groupId) {
  return TESTS.filter((t) => t.group === groupId);
}
