# Leitmotif

Composes a leitmotif for the character you are chatting with: a short instrumental theme, played with sampled General MIDI instruments, right in the browser. You can download it as a MIDI file.

The character card is first read into a music brief (key, tempo, mood, motif), then a second call turns that brief, together with the chat's recent messages, into a 2 to 6 track score. That is two AI calls through whatever backend SillyTavern is already configured with, and only when you ask for a theme; the brief is cached per character, so later themes for the same character need one call. Playback, looping, and MIDI export happen locally after that. The extension makes no network calls of its own.

## Install

In SillyTavern, open Extensions, click Install Extension, paste this URL, and confirm:

```
https://github.com/elana-voss/SillyTavern-Extension-Leitmotif
```

Expect a large first download, about 300 MB: the instrument samples are inside the repository. Later updates are small.

Then open a character chat and choose Generate Theme in the Extensions menu (the wand icon next to the input box).

## Use

Generate Theme in the Extensions menu writes a theme for the current character and the current scene and plays it. While it plays, the menu offers Pause Theme (Resume Theme) and Stop Theme; a theme fades in and out, and a new theme crossfades over the old one. Download the generated theme as MIDI saves the result.

The settings panel holds the rest: theme length (15 seconds to 2 minutes), tempo, Tempo follows the character (the analysis picks the BPM, on by default), Story context (how many recent chat messages the composer reads to fit the scene's mood, 0 to 40, 10 by default; 0 uses the card only), Theme variety (Focused / Standard / Wild), and Volume. The meter (3/4 or 4/4) always comes from the analysis. It also shows the music brief of the last analysis.

Each track plays in its own place in the stereo field with a little room reverb, generated in the browser.

On iPhone and iPad (Safari or a Home Screen web app), audio is started by your tap on Generate Theme. If iOS still blocks it when the theme is ready, the menu shows Play Theme; one more tap starts it. After a call or an app switch the theme resumes, or waits for Resume Theme. Playback is set as media, so the silent switch does not mute it (iOS 16.4 and later).

## Development

Code lives in `src/` (pure modules, no SillyTavern imports; `index.js` is the SillyTavern entry), tests in `tests/`: `npm test` (Node 22 or later, no dependencies). `scripts/deploy-local.ps1` copies the extension into a local SillyTavern checkout.

## Credits and Licenses

The instrument samples in `samples/` are the FluidR3_GM soundfont from [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts), unmodified, licensed [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/us/). Full attribution in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

The two vendored libraries in `lib/`, soundfont-player and midi-writer-js, are MIT.

The code is LGPL-2.1-or-later, the same as SillyTavern-Extension-NPCNames. See LICENSE.
