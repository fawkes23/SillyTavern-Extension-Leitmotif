// Sampled playback: the score looped through Web Audio with the FluidR3 samples
// shipped in samples/, held notes on sustained instruments looping their sample
// at points found by loop-points.mjs, the drums track on the synthesized kit
// of drum-synth.mjs. Notes are swung by the score's feel and humanised (start
// and velocity) by timing.mjs; every track plays through its own bus of
// mix.mjs (stereo place, low cut, room reverb). One playback at a time:
// starting a new one crossfades out the old, stopping fades it out, even
// while its samples are still loading.
import { resumeAudioContext, unlockAudioContext } from './audio-unlock.mjs';
import { createDrumSynth } from './drum-synth.mjs';
import { findLoopPoints } from './loop-points.mjs';
import { createReverb, createTrackBus } from './mix.mjs';
import { DRUMS_ROLE } from './score.mjs';
import { createScriptLoader } from './script-loader.mjs';
import { createRandom, humanize, swingEvent } from './timing.mjs';

export { createReverb } from './mix.mjs';

// Instruments whose FluidR3 samples are sustained long tones: holding a note past
// the sample length must keep looping the steady-state tail instead of falling
// silent. Decaying instruments (pianos, guitars, harp, marimba, basses, pizzicato,
// percussion) are excluded so their fade finishes inside the sample. Looping is
// fail-soft per note: without a clean loop point a note fades out inside its
// sample just like a decaying instrument, so an over-inclusive entry is safe.
const SUSTAINED_INSTRUMENTS = new Set([
    // Pads
    'pad_1_new_age', 'pad_2_warm', 'pad_3_polysynth', 'pad_4_choir',
    'pad_5_bowed', 'pad_6_metallic', 'pad_7_halo', 'pad_8_sweep',
    // Ensemble and solo strings
    'string_ensemble_1', 'string_ensemble_2', 'synth_strings_1', 'synth_strings_2',
    'tremolo_strings', 'violin', 'viola', 'cello',
    // Voices
    'choir_aahs', 'voice_oohs', 'synth_choir',
    // Winds
    'flute', 'piccolo', 'recorder', 'pan_flute', 'blown_bottle',
    'shakuhachi', 'whistle', 'ocarina',
    // Reeds
    'clarinet', 'oboe', 'english_horn', 'bassoon', 'shanai', 'harmonica',
    // Saxophones
    'soprano_sax', 'alto_sax', 'tenor_sax', 'baritone_sax',
    // Brass
    'trumpet', 'muted_trumpet', 'french_horn', 'trombone', 'tuba',
    'brass_section', 'synth_brass_1', 'synth_brass_2',
    // Organs and free reeds
    'drawbar_organ', 'percussive_organ', 'rock_organ', 'church_organ',
    'reed_organ', 'accordion', 'tango_accordion', 'bagpipe',
    // Synth leads and basses
    'lead_1_square', 'lead_2_sawtooth', 'lead_3_calliope', 'lead_4_chiff',
    'lead_5_charang', 'lead_6_voice', 'lead_7_fifths', 'lead_8_bass__lead',
    'synth_bass_1', 'synth_bass_2',
    // Atmospheric FX patches hold a steady texture
    'fx_2_soundtrack', 'fx_4_atmosphere', 'fx_6_goblins', 'fx_7_echoes', 'fx_8_scifi',
]);
const NOTE_SEMITONES = { A: 9, B: 11, C: 0, D: 2, E: 4, F: 5, G: 7 };

function noteToMidiNumber(note) {
    const match = /^([A-G])([#b]?)(\d)$/.exec(note);
    if (!match) {
        return null;
    }
    const [, letter, accidental, octave] = match;
    const offset = NOTE_SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
    return offset + (Number(octave) + 1) * 12;
}

function getNoteBuffer(player, note) {
    const midi = noteToMidiNumber(note);
    // soundfont-player keys its decoded buffers by MIDI number, but fall back to
    // the note name in case a future version stops remapping them.
    return (midi === null ? null : player.buffers?.[midi]) ?? player.buffers?.[note] ?? null;
}

const loopPointsCache = new WeakMap();

function getLoopPoints(buffer) {
    if (!loopPointsCache.has(buffer)) {
        const channels = [];
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            channels.push(buffer.getChannelData(channel));
        }
        loopPointsCache.set(buffer, findLoopPoints(channels, buffer.sampleRate));
    }
    return loopPointsCache.get(buffer);
}

// The play options for one note: gain, a release scaled to the note, and either
// a loop over the sample's clean region or a duration that ends inside it.
function getNoteOptions(buffer, { velocity, requestedLength, sustainedInstrument }) {
    const gain = 0.48 * velocity / 127;
    // FluidR3 samples are only 1-2 seconds long, while a chord held for several
    // beats at a slow tempo lasts longer than that. Without special handling the
    // audio simply runs out mid-note and the gain envelope never fades, which
    // sounds like a clipped note ending.
    const sampleLength = buffer?.duration ?? 0;
    const hasSampleLength = sampleLength > 0.05;
    // Scale the fade-out with the note: a fixed short release chops long notes
    // to silence abruptly, while fast short notes still need a quick release to
    // stay articulate.
    const release = hasSampleLength
        ? Math.min(0.6, requestedLength * 0.5, sampleLength * 0.4)
        : Math.min(0.6, requestedLength * 0.5);
    const options = { gain, release };
    // Held notes on sustained instruments loop the sample region whose waveform
    // continues smoothly into itself, so the note can reach its full length
    // without a tick at the loop point.
    const loopPoints = hasSampleLength && sustainedInstrument ? getLoopPoints(buffer) : null;
    if (loopPoints) {
        options.loop = true;
        options.loopStart = loopPoints.start;
        options.loopEnd = loopPoints.end;
        options.duration = requestedLength;
    } else if (hasSampleLength) {
        // Decaying instruments cannot be looped without repeating their attack,
        // so finish the fade before the sample ends.
        options.duration = Math.min(requestedLength, Math.max(0.05, sampleLength - release));
    } else {
        options.duration = requestedLength;
    }
    return options;
}

// One player per track: the synthesized kit for drums, a sample file otherwise.
// Both callbacks also receive the track, for its role.
export function loadTrackPlayers(tracks, { loadSample, createDrums }) {
    return Promise.all(tracks.map(track =>
        track.role === DRUMS_ROLE ? createDrums(track) : loadSample(track.instrument, track)));
}

// The same humanisation every time a theme starts, varying from pass to pass.
const HUMANIZE_SEED = 1;

// The master bus every player writes into: a compressor, then a gain, into
// output (the context's speakers by default). Exported with schedulePass,
// loadScorePlayers and createReverb so tools/music-eval/render-audio.mjs
// renders a theme offline through the same chain.
export function createMasterChain(audioContext, output = audioContext.destination) {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 12;
    compressor.ratio.value = 8;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.75;
    compressor.connect(masterGain);
    masterGain.connect(output);
    return compressor;
}

// A fresh humaniser, the same for every playback of a theme.
export function createHumanizer() {
    return createRandom(HUMANIZE_SEED);
}

// One pass of the loop from startTime: every note swung, humanised and played.
export function schedulePass(score, players, { startTime, random }) {
    const beatLength = 60 / score.tempo;
    score.tracks.forEach((track, trackIndex) => {
        const player = players[trackIndex];
        const sustainedInstrument = SUSTAINED_INSTRUMENTS.has(track.instrument);
        for (const event of track.events) {
            const { beat, duration } = swingEvent(event.beat, event.duration, score.feel, { drums: track.role === DRUMS_ROLE });
            const requestedLength = duration * beatLength;
            for (const note of event.notes) {
                const { when, velocity } = humanize(
                    { beat, when: startTime + beat * beatLength, velocity: event.velocity },
                    { random, loopStart: startTime },
                );
                const options = getNoteOptions(getNoteBuffer(player, note), {
                    velocity,
                    requestedLength,
                    sustainedInstrument,
                });
                player.play(note, when, options);
            }
        }
    });
}

// The players for a score: the drum synth and the shipped samples, loaded
// through soundfont-player (the Soundfont global), each into its own track
// bus that plays into destination and, when given, sends to reverb.
export function loadScorePlayers(soundfont, audioContext, score, { sampleUrlBase, destination, reverb, logTag }) {
    const busFor = track => createTrackBus(audioContext, { role: track.role, destination, reverb });
    return loadTrackPlayers(score.tracks, {
        createDrums: track => createDrumSynth(audioContext, { destination: busFor(track) }),
        loadSample: async (instrument, track) => {
            const url = new URL(`${instrument}-mp3.js`, sampleUrlBase).href;
            try {
                return await soundfont.instrument(audioContext, url, { destination: busFor(track) });
            } catch (error) {
                console.error(logTag, `Could not load the sample file for ${instrument}`, url, error);
                throw new Error(`The ${instrument} sample could not be loaded. The extension appears to be installed incompletely; reinstall it.`);
            }
        },
    });
}

const START_DELAY = 0.08;
const FADE_IN_SECONDS = 0.4;
const FADE_OUT_SECONDS = 1.2;
const PAUSE_FADE_SECONDS = 0.15;
const RESUME_FADE_SECONDS = 0.3;

// soundfontUrl: the soundfont-player script; sampleUrlBase: the samples/ folder
// URL; onStop: called after every stop, to show the idle state; onStateChange:
// called with 'paused', 'playing', 'blocked' (a resume the browser refused) or
// 'interrupted' (the system took the audio away, e.g. a call on iOS).
export function createPlayback({ soundfontUrl, sampleUrlBase, logTag, onStop, onStateChange = () => {} }) {
    const loadSoundfont = createScriptLoader(soundfontUrl, 'Soundfont');
    let audioContext;
    let masterInput;
    let volumeGain;
    let volume = 0.64;
    let active = false;
    let paused = false;
    let pauseToken = 0;
    let generation = 0;
    let timer;
    // The theme that is sounding: { fader, players, nextStart, scheduleLoop }.
    let session = null;

    function getAudioContext() {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) {
            throw new Error('This browser does not support the Web Audio API.');
        }
        if (!audioContext) {
            audioContext = new AudioContextConstructor();
            volumeGain = audioContext.createGain();
            volumeGain.gain.value = volume;
            volumeGain.connect(audioContext.destination);
            masterInput = createMasterChain(audioContext, volumeGain);
        }
        return audioContext;
    }

    // Call synchronously inside a user's tap or click, before anything is
    // awaited: iOS starts audio only from inside a gesture.
    function unlock() {
        try {
            unlockAudioContext(getAudioContext(), { navigatorObject: globalThis.navigator });
        } catch (error) {
            console.warn(logTag, 'Could not unlock audio:', error);
        }
    }

    // Resolves true once audio runs, false while the browser still blocks it
    // (iOS outside a gesture); never hangs.
    function ensureAudioContext() {
        return resumeAudioContext(getAudioContext());
    }

    function rampTo(param, value, seconds) {
        const now = audioContext.currentTime;
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
        param.linearRampToValueAtTime(value, now + Math.max(0.005, seconds));
    }

    function clearTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = undefined;
        }
    }

    // Schedules the next pass shortly before the current one ends.
    function armTimer(current) {
        clearTimer();
        timer = setTimeout(
            () => current.scheduleLoop(Math.max(current.nextStart, audioContext.currentTime + START_DELAY)),
            Math.max(0, (current.nextStart - audioContext.currentTime - 0.1) * 1000),
        );
    }

    // Fades a theme out over seconds (0: at once), then stops its players.
    function release(old, seconds) {
        const silence = () => {
            for (const player of old.players) {
                player.stop();
            }
            old.fader.disconnect();
        };
        if (seconds <= 0) {
            silence();
            return;
        }
        try {
            rampTo(old.fader.gain, 0, seconds);
        } catch {
            silence();
            return;
        }
        setTimeout(silence, seconds * 1000 + 100);
    }

    // Stops the theme, fading it out unless fade is false or it is paused.
    function stop({ fade = true } = {}) {
        generation += 1;
        active = false;
        const wasPaused = paused;
        paused = false;
        pauseToken += 1;
        clearTimer();
        const old = session;
        session = null;
        if (old) {
            const running = audioContext?.state === 'running';
            release(old, fade && running && !wasPaused ? FADE_OUT_SECONDS : 0);
        }
        onStop();
    }

    // Loads the samples, then loops the score until stop() or the next play(),
    // which crossfades: the old theme fades out while this one fades in.
    // onLoading runs once playback counts as active, onStarted once the first
    // pass is scheduled. Needs ensureAudioContext() to have run first.
    async function play(score, { onLoading, onStarted }) {
        getAudioContext();
        stop();
        const current = generation;
        active = true;
        onLoading();
        const fader = audioContext.createGain();
        fader.gain.value = 0;
        fader.connect(masterInput);
        try {
            const reverb = createReverb(audioContext, fader);
            const soundfont = await loadSoundfont();
            // Samples ship with the extension in samples/; there is no network
            // fallback, so a missing file means an incomplete install.
            const players = await loadScorePlayers(soundfont, audioContext, score, {
                sampleUrlBase,
                destination: fader,
                reverb,
                logTag,
            });
            if (current !== generation) {
                for (const player of players) {
                    player.stop();
                }
                fader.disconnect();
                return;
            }

            const loopLength = score.loopBeats * (60 / score.tempo);
            const random = createHumanizer();
            const playing = { fader, players, nextStart: 0, scheduleLoop: null };
            playing.scheduleLoop = startTime => {
                if (current !== generation) {
                    return;
                }
                schedulePass(score, players, { startTime, random });
                playing.nextStart = startTime + loopLength;
                if (!paused) {
                    armTimer(playing);
                }
            };
            session = playing;
            rampTo(fader.gain, 1, START_DELAY + FADE_IN_SECONDS);
            onStarted();
            playing.scheduleLoop(audioContext.currentTime + START_DELAY);
        } catch (error) {
            fader.disconnect();
            if (current === generation) {
                stop({ fade: false });
            }
            throw error;
        }
    }

    // Fades out briefly, then suspends the audio clock, so the loop picks up
    // where it stopped on resume().
    function pause() {
        if (!active || paused || !session) {
            return false;
        }
        paused = true;
        clearTimer();
        const token = ++pauseToken;
        rampTo(session.fader.gain, 0, PAUSE_FADE_SECONDS);
        setTimeout(() => {
            if (paused && token === pauseToken) {
                Promise.resolve()
                    .then(() => audioContext.suspend())
                    .catch(() => {});
            }
        }, PAUSE_FADE_SECONDS * 1000 + 40);
        onStateChange('paused');
        return true;
    }

    // Call after unlock() inside a tap. Resolves true once the theme plays
    // again, false if the browser still blocks audio.
    function resume() {
        if (!active || !paused || !session) {
            return Promise.resolve(false);
        }
        const current = session;
        pauseToken += 1;
        return resumeAudioContext(audioContext).then(running => {
            if (current !== session || !paused) {
                return running;
            }
            if (!running) {
                onStateChange('blocked');
                return false;
            }
            paused = false;
            rampTo(current.fader.gain, 1, RESUME_FADE_SECONDS);
            armTimer(current);
            onStateChange('playing');
            return true;
        });
    }

    // After the page comes back (an app switch, a call, a locked screen): a
    // playing theme resumes if the browser allows it, else waits paused for a
    // tap on Resume.
    function recover() {
        if (!active || paused || !session || !audioContext || audioContext.state === 'running') {
            return Promise.resolve(true);
        }
        const current = session;
        return resumeAudioContext(audioContext).then(running => {
            if (current !== session || paused) {
                return running;
            }
            if (running) {
                armTimer(current);
                return true;
            }
            paused = true;
            clearTimer();
            onStateChange('interrupted');
            return false;
        });
    }

    // value: 0 to 1, applied as gain with a short glide.
    function setVolume(value) {
        volume = Math.min(1, Math.max(0, value));
        if (volumeGain) {
            volumeGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.05);
        }
    }

    return {
        unlock,
        ensureAudioContext,
        play,
        stop,
        pause,
        resume,
        recover,
        setVolume,
        isActive: () => active,
        isPaused: () => paused,
    };
}
