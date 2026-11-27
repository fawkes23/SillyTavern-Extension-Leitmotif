// Status line texts shared by every path that leaves the extension idle, and
// the elapsed time shown while a theme is generated.

export function getIdleStatus(hasTheme) {
    return hasTheme
        ? 'Theme ready. Generate another or download the MIDI.'
        : 'Ready when a character chat is open.';
}

// Milliseconds as m:ss, e.g. 65000 -> "1:05".
export function formatElapsed(milliseconds) {
    const total = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}
