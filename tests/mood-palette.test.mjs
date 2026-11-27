// Tests for mood-palette.mjs: every instrument is playable, every mood has
// cues and flavours old and new, and the prompt section lists them all.
import assert from 'node:assert/strict';
import test from 'node:test';
import { MOOD_PALETTE, moodPaletteToPromptSection, PALETTE_ERAS } from '../src/mood-palette.mjs';
import { INSTRUMENTS } from '../src/score.mjs';

test('every palette instrument is a General MIDI instrument with a shipped sample', () => {
    for (const row of MOOD_PALETTE) {
        for (const item of row.flavours) {
            for (const instrument of item.instruments) {
                assert.ok(Object.hasOwn(INSTRUMENTS, instrument), `${row.mood} / ${item.name}: ${instrument}`);
            }
        }
    }
});

test('every mood has cues and at least three complete flavours, old and new', () => {
    assert.ok(MOOD_PALETTE.length >= 15);
    for (const row of MOOD_PALETTE) {
        assert.ok(row.mood && row.cues, row.mood);
        assert.ok(row.flavours.length >= 3, row.mood);
        const eras = new Set(row.flavours.map(item => item.era));
        assert.ok(eras.has('modern') || eras.has('electronic'), `${row.mood}: no modern flavour`);
        assert.ok(eras.has('classic') || eras.has('folk'), `${row.mood}: no classic or folk flavour`);
        for (const item of row.flavours) {
            assert.ok(PALETTE_ERAS.includes(item.era), `${row.mood} / ${item.name}: era ${item.era}`);
            assert.ok(item.instruments.length >= 3, `${row.mood} / ${item.name}`);
            for (const field of ['name', 'harmony', 'rhythm', 'styles']) {
                assert.ok(typeof item[field] === 'string' && item[field].length > 0, `${row.mood} / ${item.name}: ${field}`);
            }
        }
    }
});

test('the prompt section lists each mood with its cues, then its flavours', () => {
    const section = moodPaletteToPromptSection();
    const flavourCount = MOOD_PALETTE.reduce((sum, row) => sum + row.flavours.length, 0);
    assert.ok(section.startsWith('<mood_palette>\nsadness (a death, a farewell'));
    assert.ok(section.endsWith('\n</mood_palette>'));
    assert.equal(section.split('\n').length, MOOD_PALETTE.length + flavourCount + 2);
    assert.match(section, /- quiet grief \[classic\]: acoustic_grand_piano, cello/);
    assert.match(section, /- swagger \[modern\]: synth_bass_1/);
    assert.match(section, /- creepy innocence \[contrast\]: music_box/);
    assert.doesNotMatch(section, /drum_kit/);
});
