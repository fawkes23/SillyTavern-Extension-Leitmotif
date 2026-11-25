// Tests for audio-unlock.mjs: unlocking inside the tap, and resuming later
// without hanging when iOS keeps the context locked.
import assert from 'node:assert/strict';
import test from 'node:test';
import { resumeAudioContext, unlockAudioContext } from '../src/audio-unlock.mjs';

function createFakeContext({ state = 'suspended', resume } = {}) {
    const calls = { resume: 0, started: 0, connected: 0 };
    const context = {
        state,
        sampleRate: 44100,
        destination: 'destination',
        createBuffer: (channels, length, rate) => ({ channels, length, rate }),
        createBufferSource: () => ({
            connect: () => { calls.connected += 1; },
            start: () => { calls.started += 1; },
        }),
        resume: () => {
            calls.resume += 1;
            return resume ? resume(context) : Promise.resolve();
        },
    };
    return { context, calls };
}

const neverSettles = () => new Promise(() => {});

test('a running context resumes at once', async () => {
    const { context, calls } = createFakeContext({ state: 'running' });
    assert.equal(await resumeAudioContext(context), true);
    assert.equal(calls.resume, 0);
});

test('a context that starts running on resume reports true', async () => {
    const { context } = createFakeContext({
        resume: ctx => {
            ctx.state = 'running';
            return Promise.resolve();
        },
    });
    assert.equal(await resumeAudioContext(context, { timeoutMs: 1000 }), true);
});

test('a resume that never settles, as on iOS outside a tap, reports false instead of hanging', async () => {
    const { context } = createFakeContext({ resume: neverSettles });
    assert.equal(await resumeAudioContext(context, { timeoutMs: 10 }), false);
});

test('a rejected resume reports false', async () => {
    const { context } = createFakeContext({ resume: () => Promise.reject(new Error('not allowed')) });
    assert.equal(await resumeAudioContext(context, { timeoutMs: 1000 }), false);
});

test('unlocking plays a silent frame, resumes, and routes audio as media playback', async () => {
    const { context, calls } = createFakeContext({ resume: neverSettles });
    const navigatorObject = { audioSession: { type: 'auto' } };
    unlockAudioContext(context, { navigatorObject });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(navigatorObject.audioSession.type, 'playback');
    assert.equal(calls.started, 1);
    assert.equal(calls.connected, 1);
    assert.equal(calls.resume, 1);
});

test('unlocking works without audioSession or buffer support and skips a running context', async () => {
    const { context, calls } = createFakeContext({ state: 'running' });
    context.createBuffer = () => {
        throw new Error('unsupported');
    };
    assert.doesNotThrow(() => unlockAudioContext(context, { navigatorObject: {} }));
    assert.doesNotThrow(() => unlockAudioContext(context));
    await Promise.resolve();
    assert.equal(calls.resume, 0);
});
