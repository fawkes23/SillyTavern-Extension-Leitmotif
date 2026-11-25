// Starting Web Audio on iOS (Safari and Home Screen web apps). WebKit lets a
// page start audio only from inside a user gesture: an AudioContext created or
// resumed later stays suspended, and its resume() promise never settles, so
// awaiting it hangs forever. unlockAudioContext runs synchronously inside the
// tap; resumeAudioContext checks later without ever hanging.

// Called inside the user's tap, before anything is awaited.
export function unlockAudioContext(audioContext, { navigatorObject } = {}) {
    // Treat Web Audio as media playback, so the iPhone's silent switch does not
    // mute it (Safari 16.4 and later; ignored elsewhere).
    try {
        const audioSession = navigatorObject?.audioSession;
        if (audioSession && audioSession.type !== 'playback') {
            audioSession.type = 'playback';
        }
    } catch {
        // Not supported: playback still works, just obeys the silent switch.
    }
    // Older iOS versions unlock audio only once a sound starts inside the
    // gesture: a one-frame silent buffer is enough.
    try {
        const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(0);
    } catch {
        // Not needed where resume() alone unlocks audio.
    }
    if (audioContext.state !== 'running') {
        // Not awaited: the call itself must happen inside the gesture.
        Promise.resolve()
            .then(() => audioContext.resume())
            .catch(() => {});
    }
}

// Resolves true once the context runs, false if it is still locked after
// timeoutMs or resume() fails; never hangs, unlike awaiting resume() on iOS.
export function resumeAudioContext(audioContext, {
    timeoutMs = 1500,
    setTimer = setTimeout,
    clearTimer = clearTimeout,
} = {}) {
    if (audioContext.state === 'running') {
        return Promise.resolve(true);
    }
    return new Promise(resolve => {
        let settled = false;
        let timer;
        const finish = running => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimer(timer);
            resolve(running);
        };
        timer = setTimer(() => finish(audioContext.state === 'running'), timeoutMs);
        Promise.resolve()
            .then(() => audioContext.resume())
            .then(() => finish(audioContext.state === 'running'), () => finish(false));
    });
}
