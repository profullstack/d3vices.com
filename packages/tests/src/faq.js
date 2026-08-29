/**
 * The questions people actually arrive with, per instrument.
 *
 * They exist for two reasons. A test page was otherwise a heading, a blurb and
 * the mount point for the test itself, which made two pages in the same group
 * read as near-duplicates of each other. And the useful half of a device tester
 * is not the reading, it is knowing what the reading means: a resolution lower
 * than the camera claims, a resting stick that is not quite zero, an API the
 * browser simply does not have.
 *
 * Keyed by test id. Pure data, like the registry it attaches to.
 */
export const FAQ = {
  microphone: [
    {
      q: 'I can see the waveform but hear nothing on playback. What is broken?',
      a: 'The waveform comes from the live input and the playback comes from your output device, so if one works and the other does not, the microphone is fine and the fault is downstream. Run the speaker test next.',
    },
    {
      q: 'Is the recording uploaded anywhere?',
      a: 'No. The clip is held in memory in your own tab and is gone when you close the page. Nothing is sent to a server, and there is nothing to delete afterwards.',
    },
    {
      q: 'The browser never asks for permission.',
      a: 'You have blocked the site at some point and the browser remembers. Chrome and Edge keep that decision behind the padlock in the address bar, Firefox behind the permissions icon, and Safari under Settings for this website. Clear it and reload.',
    },
    {
      q: 'Which microphone is it actually using?',
      a: 'Whichever the browser picks by default, which on a laptop with a headset plugged in is often not the one you expect. The device list on the page switches inputs without leaving it.',
    },
  ],

  speaker: [
    {
      q: 'The left channel plays and the right is silent. Is the speaker dead?',
      a: 'Not necessarily. Try another cable and another port first, then the same test on a different device. A channel silent everywhere is a driver or amplifier fault, while a channel silent only here is usually wiring or a balance setting in the operating system.',
    },
    {
      q: 'How high should I be able to hear the sweep?',
      a: 'Most adults lose the sweep somewhere between 15 and 17 kHz, and that ceiling falls with age. Hearing nothing above roughly 18 kHz tells you about your ears, not about your speakers.',
    },
    {
      q: 'Does this need a permission?',
      a: 'No. Playing audio needs no permission at all. The first sound may need a click, because browsers refuse to start audio that no one asked for.',
    },
  ],

  camera: [
    {
      q: 'Why is the resolution lower than my camera supports?',
      a: 'The browser negotiates a resolution with the camera rather than always taking the maximum. What is shown is what the stream is really delivering, which is also what a video call would send.',
    },
    {
      q: 'The camera light is on but the picture is black.',
      a: 'Another application is usually still holding the camera. Close any video call app and try again. On Windows, also check that the camera privacy setting allows your browser.',
    },
    {
      q: 'Do any frames leave my machine?',
      a: 'No. The preview is a video element and the still is drawn to a canvas, both inside your own tab. There is no upload step in this test.',
    },
  ],

  'screen-share': [
    {
      q: 'Why is the frame rate lower than I expected?',
      a: 'Screen capture is adaptive. The browser drops frames when the content is not changing or the machine is busy, so a still desktop reports a low rate and that is normal rather than a fault.',
    },
    {
      q: 'The picker comes up empty on Linux.',
      a: 'Wayland routes screen capture through the desktop portal. If the portal is missing, or the browser is a snap or flatpak without permission for it, nothing appears. Chrome on X11 is the quickest way to tell the two apart.',
    },
    {
      q: 'Can I share audio as well?',
      a: 'Only on Chromium, only for a tab or a whole screen, and only if you tick the box in the picker. Firefox and Safari do not offer it at all.',
    },
  ],

  display: [
    {
      q: 'How do I tell a dead pixel from a stuck one?',
      a: 'A dead pixel stays black on every colour. A stuck pixel stays lit in one colour and shows up against the opposite full-screen colour. Stuck pixels sometimes recover on their own; dead ones do not.',
    },
    {
      q: 'Do I have to run it full screen?',
      a: 'Yes, if you care about the edges. Anything less leaves browser chrome covering part of the panel, and the edges are exactly where backlight bleed tends to show.',
    },
    {
      q: 'What are the steps I can see on the grey ramp?',
      a: 'Visible banding in a greyscale ramp means the panel or the link is running 6-bit rather than 8-bit colour, or a display setting is clamping the range. It is a signal path problem more often than a panel fault.',
    },
  ],

  'screen-info': [
    {
      q: 'Why does it report fewer pixels than my monitor has?',
      a: 'The browser reports CSS pixels. Multiply by the device pixel ratio shown beside it for physical pixels: a 4K display at 200% scaling reports 1920 by 1080 with a ratio of 2.',
    },
    {
      q: 'The refresh rate is not the one I set.',
      a: 'It is measured from real frame callbacks, so a throttled background tab, a variable refresh panel or a laptop on battery will all read below the panel maximum. Keep the tab focused while it measures.',
    },
    {
      q: 'What are safe-area insets?',
      a: 'The margins a phone reserves for a notch, a rounded corner or a home indicator. They matter when you build a full-bleed layout, and they are zero on almost every desktop.',
    },
  ],

  keyboard: [
    {
      q: 'A key does nothing here but works everywhere else.',
      a: 'Some keys never reach the page at all. The operating system takes them first, which is normal and expected for Print Screen, most media keys, and a lone Windows or Command press.',
    },
    {
      q: 'What is n-key rollover and why does it matter?',
      a: 'It is how many keys the board can report at once. Membrane keyboards often stop at six, or block particular combinations, which shows up in games as a movement key being ignored while two others are held.',
    },
    {
      q: 'Why do keys stay lit after I let go?',
      a: 'On purpose. Once a key has been seen it stays marked, so you can work across the whole board and then look for what never registered.',
    },
  ],

  mouse: [
    {
      q: 'The polling rate reads lower than my mouse claims.',
      a: 'This is the rate the browser sees, not the rate the mouse sends. Browsers coalesce pointer events to the display refresh, so a 1000 Hz mouse commonly reads near your monitor refresh rate. Keep the pointer moving for the best estimate.',
    },
    {
      q: 'One physical click registers as two.',
      a: 'That is a worn switch, and it is the most common mouse fault there is. The test flags a second click that arrives impossibly soon after the first, which is the signature of switch bounce rather than of your hand.',
    },
    {
      q: 'The back and forward buttons do nothing.',
      a: 'They arrive as buttons 3 and 4. If they do nothing on the page but still work in the browser, the browser is consuming them before the page ever sees them.',
    },
  ],

  touch: [
    {
      q: 'How many fingers should my screen track at once?',
      a: 'Ten on most modern phones and tablets, five on many laptop trackpads, and two on older or cheaper digitisers. Fewer than the specification claims usually points at a driver rather than at the glass.',
    },
    {
      q: 'Pressure always reads the same number.',
      a: 'Most hardware does not report real pressure, so the browser substitutes a constant, usually 0.5 or 1. Only a pressure-sensitive digitiser, such as one driving a stylus, gives a varying figure.',
    },
    {
      q: 'Part of the screen does not respond.',
      a: 'Draw slowly across the whole surface. A gap that repeats in the same place is a dead zone in the digitiser. A gap that moves with you is usually a screen protector, moisture or a glove.',
    },
  ],

  gamepad: [
    {
      q: 'The controller is connected but nothing appears.',
      a: 'The Gamepad API stays silent until the pad sends something. Press any button once and it appears. That is a privacy measure in the browser, not a fault in the controller.',
    },
    {
      q: 'What actually counts as stick drift?',
      a: 'A resting stick that does not read zero. Small offsets are normal and games apply a dead zone to hide them. A reading that wanders on its own, or sits well away from centre, is worn hardware.',
    },
    {
      q: 'Rumble does nothing.',
      a: 'Vibration needs the browser, the pad and the connection to all support it. Chromium over USB usually works, Bluetooth often does not, and Firefox and Safari do not implement it at all.',
    },
  ],

  midi: [
    {
      q: 'Nothing works in Firefox or Safari.',
      a: 'Neither browser implements Web MIDI, so there is nothing for the page to talk to. Use Chrome, Edge or another Chromium browser. The test says the API is missing rather than reporting a dead controller.',
    },
    {
      q: 'The device is listed but no notes arrive.',
      a: 'Something else is holding the port. On Windows a DAW or a standalone synth takes a MIDI device exclusively, so nothing else can open it. Close that application and reload.',
    },
    {
      q: 'Does Bluetooth MIDI work?',
      a: 'On macOS and Android it does, once the device is paired at the operating system level. On Windows it depends on the driver, and often it does not.',
    },
  ],

  cps: [
    {
      q: 'What counts as a good clicks per second score?',
      a: 'Ordinary clicking lands around 5 to 8 CPS. Above 10 usually means a technique such as jitter or butterfly clicking. Sustained rates much over 14 across a full 10 second run are rarely genuine.',
    },
    {
      q: 'Which duration should I pick?',
      a: 'Ten seconds is the common benchmark and the number most scores are quoted at. The 1 and 5 second runs reward a burst, while 30 and 60 second runs measure stamina instead.',
    },
    {
      q: 'Where is my best score kept?',
      a: 'In local storage on your own device. There is no account and no leaderboard, so clearing site data clears your history with it.',
    },
  ],

  kohi: [
    {
      q: 'How is this different from an ordinary CPS test?',
      a: 'It is fixed at ten seconds and the clock starts on your first click rather than on a countdown, which is how the Kohi Minecraft server scored it. That keeps scores comparable with the ones players have quoted for years.',
    },
    {
      q: 'What score do PvP players aim for?',
      a: 'Around 8 to 10 CPS is a solid normal-clicking result, and jitter or butterfly clickers report higher. Many servers cap the click rate they will accept regardless of what you can produce.',
    },
    {
      q: 'Does a gaming mouse help?',
      a: 'A little. Debounce time sets a floor on how quickly one switch can register two presses, and a lower debounce is better, but technique dominates the result.',
    },
  ],

  jitter: [
    {
      q: 'Why report the spread between clicks and not just the rate?',
      a: 'A peak rate can come from one lucky half second. The standard deviation of the gap between clicks tells you whether the burst is repeatable, which is what decides a fight.',
    },
    {
      q: 'Is jitter clicking bad for your hand?',
      a: 'It works by tensing the forearm so the hand shakes, and people do report strain from sustained use. Short runs are the sensible way to do it.',
    },
    {
      q: 'Does it wear the mouse out?',
      a: 'Faster than normal clicking, yes. A worn switch is exactly what produces the accidental double clicks the mouse test looks for.',
    },
  ],

  reaction: [
    {
      q: 'What is a normal reaction time?',
      a: 'Most people land between 200 and 300 milliseconds on a visual cue, and 150 to 200 is fast. Anything under 100 means you anticipated the change rather than reacted to it.',
    },
    {
      q: 'Why five rounds instead of one?',
      a: 'One round is mostly luck. A median of five discards a single flinch and a single lapse, and it is the figure worth comparing against yourself later.',
    },
    {
      q: 'Does my monitor affect the score?',
      a: 'Yes. Display refresh and input lag are part of what is being measured, so the same person reads faster on a 144 Hz panel than on a 60 Hz one. Only compare runs on the same hardware.',
    },
  ],

  scroll: [
    {
      q: 'Why normalise the wheel deltas?',
      a: 'Browsers report scrolling in pixels, lines or pages depending on the device and the platform. Without normalising, a trackpad and a notched wheel are not on the same scale and the numbers cannot be compared.',
    },
    {
      q: 'A free-spinning wheel scores much higher. Is that fair?',
      a: 'It is a real difference in the hardware rather than a fault. A free-spinning wheel has no detents slowing it down, so it beats a notched wheel on any measure of raw speed.',
    },
    {
      q: 'Does it work with a trackpad?',
      a: 'Yes. Two-finger scrolling arrives as wheel events and is measured the same way, though it feels different enough that the two scores are not really comparable.',
    },
  ],

  network: [
    {
      q: 'Why is this slower than the speed test my provider links to?',
      a: 'Most speed tests open many parallel connections to a nearby server chosen to flatter the number. This measures one realistic transfer against a single endpoint, which is closer to what a download or a video call actually gets.',
    },
    {
      q: 'What is jitter, and why does it matter more than raw speed?',
      a: 'Jitter is the variation in round-trip time. Calls and games break up because of jitter and loss long before they run out of bandwidth, so a steady 20 Mbps beats an erratic 200.',
    },
    {
      q: 'Does this use my data allowance?',
      a: 'Yes. It moves real bytes in both directions, because that is the only honest way to measure throughput. The download is capped, but it is not a test to repeat on a metered connection.',
    },
  ],

  battery: [
    {
      q: 'Nothing shows in Firefox or Safari.',
      a: 'Both removed the Battery Status API, because a precise charge level is a useful way to fingerprint a device across sites. Chromium browsers still expose it, and the test reports the API as missing rather than claiming a battery fault.',
    },
    {
      q: 'Does this tell me my battery health?',
      a: 'No. The browser exposes charge level and charging state and nothing else. Wear, cycle count and design capacity are not available to a web page, and any site claiming them from a browser alone is guessing.',
    },
    {
      q: 'The time remaining is wildly wrong.',
      a: 'It is the operating system estimate from recent usage, so it swings hard after any change in load. Ignore it for the first few minutes after plugging in or unplugging.',
    },
  ],

  geolocation: [
    {
      q: 'Why is the accuracy hundreds of metres?',
      a: 'You are being placed by network rather than by satellite. Desktops and most laptops have no GPS at all and are located from nearby wifi networks and IP address. On a phone, stepping outdoors usually tightens the fix within a minute.',
    },
    {
      q: 'Are my coordinates sent anywhere?',
      a: 'No. The position is read by the page and shown to you. It is not transmitted, logged or stored, which you can confirm in the source.',
    },
    {
      q: 'Heading and speed always read null.',
      a: 'Both are derived from movement, and a stationary device on wifi cannot supply either. They fill in on a phone that is actually moving with a satellite fix.',
    },
  ],

  motion: [
    {
      q: 'Nothing happens on my iPhone.',
      a: 'iOS requires an explicit permission granted in response to a tap, and only over a secure connection. The button on this page is what asks for it. If you refused once, clear this site under Settings in Safari and try again.',
    },
    {
      q: 'Does this work on a desktop?',
      a: 'Rarely. Desktops and most laptops have no gyroscope or accelerometer to read. This test is for phones, tablets and convertibles with a rotation sensor.',
    },
    {
      q: 'The compass points the wrong way.',
      a: 'The magnetometer needs calibrating and is pulled off by anything magnetic nearby, including a case, a stand or the laptop next to it. Move away from metal and trace a figure of eight in the air.',
    },
  ],

  'ambient-light': [
    {
      q: 'Why does it say the sensor is unavailable?',
      a: 'Only Chromium implements AmbientLightSensor, and only behind the generic sensor permission. Firefox and Safari do not implement it at all, so the reading is unavailable rather than zero and the test says which.',
    },
    {
      q: 'What do the lux figures mean?',
      a: 'Roughly: under 50 lux is a dim room, a few hundred is ordinary indoor lighting, around a thousand is an overcast day outside, and direct sunlight runs into the tens of thousands.',
    },
    {
      q: 'My phone dims its screen automatically but reports nothing here.',
      a: 'Automatic brightness reads the sensor inside the operating system, which is a different path from the web API. Working auto-brightness does not mean the browser can see the sensor.',
    },
  ],

  vibration: [
    {
      q: 'Nothing happens on my laptop.',
      a: 'Desktop browsers accept the call and do nothing, because there is no motor to drive. That is why the test reports what it asked for rather than claiming it succeeded.',
    },
    {
      q: 'My iPhone will not vibrate from the page.',
      a: 'Safari does not implement the Vibration API on iOS at all, so there is nothing for the page to call. Haptics on iOS are available to native apps only. This works on Android, in Chrome and in Firefox.',
    },
    {
      q: 'The pattern is cut short.',
      a: 'Android limits how long a page may vibrate and will truncate a long pattern. Silent mode and battery saver can suppress it entirely, with no error for the page to report.',
    },
  ],

  bluetooth: [
    {
      q: 'The chooser is empty.',
      a: 'Web Bluetooth only lists devices that are advertising and in pairing mode, and it will not show one already connected to the operating system. Put the device into pairing mode first, then scan.',
    },
    {
      q: 'Why does it not work in Firefox or Safari?',
      a: 'Neither implements Web Bluetooth. It needs Chrome, Edge or another Chromium browser, and on some Linux builds it also needs the experimental platform features flag turned on.',
    },
    {
      q: 'Can it see my headphones or my mouse?',
      a: 'Usually not. Classic Bluetooth audio and HID devices sit outside Web Bluetooth, which reaches Bluetooth Low Energy GATT devices only.',
    },
  ],

  system: [
    {
      q: 'Why does it report 8 CPU cores when I have more?',
      a: 'navigator.hardwareConcurrency counts logical cores and several browsers cap the figure to limit fingerprinting. Treat it as a floor rather than as a specification.',
    },
    {
      q: 'Device memory says 8 GB and I have 32.',
      a: 'The value is rounded into a small set of buckets and capped at 8, again to limit fingerprinting. It is a coarse hint for deciding how much work to attempt, not a measurement.',
    },
    {
      q: 'What is the API list for?',
      a: 'It is the same set of capabilities every other instrument on this site depends on. When a test tells you it cannot run, this page shows whether the browser exposes the API at all.',
    },
  ],
};
