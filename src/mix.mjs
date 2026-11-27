// The mix every theme plays through: each track gets its own bus (a low cut on
// the parts above the bass, a place in the stereo field, a send to a shared
// room reverb), so the General MIDI samples sound like one ensemble in a room
// instead of dry, centred and stacked. The reverb's impulse is generated
// noise with a decaying envelope: nothing is downloaded.

// pan: -1 left to 1 right; reverb: send level; lowCut: high-pass in Hz, 0 off.
export const TRACK_MIX = Object.freeze({
    melody: Object.freeze({ pan: 0.05, reverb: 0.22, lowCut: 0 }),
    bass: Object.freeze({ pan: 0, reverb: 0.06, lowCut: 0 }),
    harmony: Object.freeze({ pan: -0.3, reverb: 0.3, lowCut: 90 }),
    counter: Object.freeze({ pan: 0.35, reverb: 0.3, lowCut: 90 }),
    texture: Object.freeze({ pan: -0.15, reverb: 0.5, lowCut: 90 }),
    drums: Object.freeze({ pan: 0, reverb: 0.12, lowCut: 0 }),
});
const DEFAULT_MIX = Object.freeze({ pan: 0, reverb: 0.2, lowCut: 0 });

export function getTrackMix(role) {
    return TRACK_MIX[role] ?? DEFAULT_MIX;
}

// The impulse response of a small hall: after a short pre-delay, noise that
// decays to silence over `seconds`, one independent channel per output channel
// so the tail is wide.
export function createImpulseChannels({
    sampleRate,
    seconds = 2.2,
    decay = 3,
    preDelay = 0.012,
    channels = 2,
    random = Math.random,
}) {
    const length = Math.max(2, Math.round(seconds * sampleRate));
    const delay = Math.min(length - 1, Math.round(preDelay * sampleRate));
    const result = [];
    for (let channel = 0; channel < channels; channel += 1) {
        const data = new Float32Array(length);
        for (let index = delay; index < length; index += 1) {
            const position = (index - delay) / (length - delay);
            data[index] = (random() * 2 - 1) * Math.pow(1 - position, decay);
        }
        result.push(data);
    }
    return result;
}

const impulseCache = new WeakMap();

function getImpulseBuffer(audioContext) {
    let buffer = impulseCache.get(audioContext);
    if (!buffer) {
        const channels = createImpulseChannels({ sampleRate: audioContext.sampleRate });
        buffer = audioContext.createBuffer(channels.length, channels[0].length, audioContext.sampleRate);
        channels.forEach((data, channel) => buffer.getChannelData(channel).set(data));
        impulseCache.set(audioContext, buffer);
    }
    return buffer;
}

// The shared reverb: returns its input, which plays (darkened a little, as a
// real room does) into destination.
export function createReverb(audioContext, destination, { level = 0.9, tone = 4500 } = {}) {
    const convolver = audioContext.createConvolver();
    convolver.buffer = getImpulseBuffer(audioContext);
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = tone;
    const output = audioContext.createGain();
    output.gain.value = level;
    convolver.connect(filter);
    filter.connect(output);
    output.connect(destination);
    return convolver;
}

// One track's bus: returns its input. The dry signal goes to destination, a
// send to reverb when there is one.
export function createTrackBus(audioContext, { role, destination, reverb }) {
    const mix = getTrackMix(role);
    const input = audioContext.createGain();
    let node = input;
    if (mix.lowCut > 0) {
        const lowCut = audioContext.createBiquadFilter();
        lowCut.type = 'highpass';
        lowCut.frequency.value = mix.lowCut;
        node.connect(lowCut);
        node = lowCut;
    }
    if (typeof audioContext.createStereoPanner === 'function') {
        const panner = audioContext.createStereoPanner();
        panner.pan.value = mix.pan;
        node.connect(panner);
        node = panner;
    }
    node.connect(destination);
    if (reverb && mix.reverb > 0) {
        const send = audioContext.createGain();
        send.gain.value = mix.reverb;
        node.connect(send);
        send.connect(reverb);
    }
    return input;
}
