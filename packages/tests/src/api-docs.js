/**
 * Where each browser API a test depends on is documented.
 *
 * A test page names the APIs it uses, which is only useful if you can find out
 * what they are. Every one points at MDN: it is the reference the specifications
 * themselves link to, and it says which browsers actually implement a thing,
 * which is the question half the questions on these pages come down to.
 *
 * Keyed by the exact strings the registry uses in `apis`, so a name added there
 * without a link here shows up as a plain label rather than a broken URL.
 */
const MDN = 'https://developer.mozilla.org/en-US/docs/Web';

export const API_DOCS = {
  AmbientLightSensor: `${MDN}/API/AmbientLightSensor`,
  AudioContext: `${MDN}/API/AudioContext`,
  'Battery Status API': `${MDN}/API/Battery_Status_API`,
  DeviceMotionEvent: `${MDN}/API/DeviceMotionEvent`,
  DeviceOrientationEvent: `${MDN}/API/DeviceOrientationEvent`,
  'Fullscreen API': `${MDN}/API/Fullscreen_API`,
  'Gamepad API': `${MDN}/API/Gamepad_API`,
  Geolocation: `${MDN}/API/Geolocation_API`,
  KeyboardEvent: `${MDN}/API/KeyboardEvent`,
  MediaRecorder: `${MDN}/API/MediaRecorder`,
  NetworkInformation: `${MDN}/API/NetworkInformation`,
  PointerEvent: `${MDN}/API/PointerEvent`,
  StorageManager: `${MDN}/API/StorageManager`,
  'Touch Events': `${MDN}/API/Touch_events`,
  'Vibration API': `${MDN}/API/Vibration_API`,
  'Vibration Actuator': `${MDN}/API/GamepadHapticActuator`,
  'Web Bluetooth': `${MDN}/API/Web_Bluetooth_API`,
  'Web MIDI': `${MDN}/API/Web_MIDI_API`,
  WebGL: `${MDN}/API/WebGL_API`,
  WheelEvent: `${MDN}/API/WheelEvent`,
  fetch: `${MDN}/API/Fetch_API`,
  getDisplayMedia: `${MDN}/API/MediaDevices/getDisplayMedia`,
  getUserMedia: `${MDN}/API/MediaDevices/getUserMedia`,
  matchMedia: `${MDN}/API/Window/matchMedia`,
  navigator: `${MDN}/API/Navigator`,
  'performance.now': `${MDN}/API/Performance/now`,
  requestAnimationFrame: `${MDN}/API/Window/requestAnimationFrame`,
  screen: `${MDN}/API/Screen`,
};
