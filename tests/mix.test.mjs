// Tests for mix.mjs: the per-track buses and the generated reverb impulse.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createImpulseChannels, createTrackBus, getTrackMix, TRACK_MIX } from '../src/mix.mjs';

function createFakeContext({ panner = true } = {}) {
    const nodes = [];
    const node = kind => {
        const created = { kind, connections: [], connect(target) { this.connections.push(target); } };
        nodes.push(created);
        return created;
    };
    const context = {
        nodes,
        createGain: () => Object.assign(node('gain'), { gain: { value: 1 } }),
        createBiquadFilter: () => Object.assign(node('filter'), { type: '', frequency: { value: 0 } }),
    };
    if (panner) {
        context.createStereoPanner = () => Object.assign(node('panner'), { pan: { value: 0 } });
    }
    return context;
}

test('every role has a mix, and an unknown role gets a centred default', () => {
    for (const role of ['melody', 'bass', 'harmony', 'counter', 'texture', 'drums']) {
        assert.equal(getTrackMix(role), TRACK_MIX[role]);
    }
    assert.deepEqual(getTrackMix('other'), { pan: 0, reverb: 0.2, lowCut: 0 });
    assert.equal(TRACK_MIX.bass.lowCut, 0);
    assert.equal(TRACK_MIX.bass.pan, 0);
});

test('a harmony bus cuts the lows, pans left and sends to the reverb', () => {
    const context = createFakeContext();
    const destination = { kind: 'destination' };
    const reverb = { kind: 'reverb' };
    const input = createTrackBus(context, { role: 'harmony', destination, reverb });
    const filter = input.connections[0];
    assert.equal(filter.type, 'highpass');
    assert.equal(filter.frequency.value, TRACK_MIX.harmony.lowCut);
    const panner = filter.connections[0];
    assert.equal(panner.pan.value, TRACK_MIX.harmony.pan);
    assert.equal(panner.connections[0], destination);
    const send = panner.connections[1];
    assert.equal(send.gain.value, TRACK_MIX.harmony.reverb);
    assert.deepEqual(send.connections, [reverb]);
});

test('a bass bus without reverb or stereo panner support goes straight to the destination', () => {
    const context = createFakeContext({ panner: false });
    const destination = { kind: 'destination' };
    const input = createTrackBus(context, { role: 'bass', destination });
    assert.deepEqual(input.connections, [destination]);
    assert.equal(context.nodes.length, 1);
});

test('the impulse starts after its pre-delay, has two channels and decays', () => {
    let seed = 1;
    const random = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
    };
    const channels = createImpulseChannels({ sampleRate: 1000, seconds: 2, preDelay: 0.01, random });
    assert.equal(channels.length, 2);
    assert.equal(channels[0].length, 2000);
    assert.ok(channels[0].slice(0, 10).every(value => value === 0));
    const energy = data => data.reduce((sum, value) => sum + value * value, 0);
    assert.ok(energy(channels[0].slice(10, 400)) > 10 * energy(channels[0].slice(1600)));
    assert.notDeepEqual(channels[0], channels[1]);
});
