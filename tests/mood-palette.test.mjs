// Tests for mood-palette.mjs: every instrument is playable, every row complete.
import assert from 'node:assert/strict';
import test from 'node:test';
import { MOOD_PALETTE, moodPaletteToPromptSection } from '../src/mood-palette.mjs';
import { INSTRUMENTS } from '../src/score.mjs';

test('every palette instrument is a General MIDI instrument with a shipped sample', () => {
    for (const row of MOOD_PALETTE) {
        for (const instrument of row.instruments) {
            assert.ok(Object.hasOwn(INSTRUMENTS, instrument), `${row.moods}: ${instrument}`);
        }
    }
});

test('every row names moods, instruments, harmony, rhythm and styles', () => {
    assert.ok(MOOD_PALETTE.length >= 15);
    for (const row of MOOD_PALETTE) {
        assert.ok(row.instruments.length >= 3, row.moods);
        for (const field of ['moods', 'harmony', 'rhythm', 'styles']) {
            assert.ok(typeof row[field] === 'string' && row[field].length > 0, `${row.moods}: ${field}`);
        }
    }
});

test('the prompt section lists one line per row', () => {
    const section = moodPaletteToPromptSection();
    assert.ok(section.startsWith('<mood_palette>\n'));
    assert.ok(section.endsWith('\n</mood_palette>'));
    assert.equal(section.split('\n').length, MOOD_PALETTE.length + 2);
    assert.match(section, /- sultry, seductive, steamy: alto_sax, tenor_sax/);
    assert.match(section, /- sad, grief, loss, regret: acoustic_grand_piano, cello/);
    assert.doesNotMatch(section, /drum_kit|drums/);
});
