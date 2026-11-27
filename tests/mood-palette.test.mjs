// Tests for mood-palette.mjs: the owner's 42 emotions, every instrument
// playable, every emotion with cues and flavours old and new, and the prompt
// sections listing them all.
import assert from 'node:assert/strict';
import test from 'node:test';
import { MOOD_PALETTE, moodPaletteToPromptSection, PALETTE_ERAS, SETTING_PALETTE } from '../src/mood-palette.mjs';
import { INSTRUMENTS } from '../src/score.mjs';

const EMOTIONS = ['Acceptance', 'Affection', 'Aggression', 'Ambivalence', 'Apathy', 'Anxiety', 'Boredom', 'Compassion',
    'Confusion', 'Contempt', 'Depression', 'Doubt', 'Ecstasy', 'Empathy', 'Envy', 'Embarrassment', 'Euphoria', 'Forgiveness',
    'Frustration', 'Gratitude', 'Grief', 'Guilt', 'Hatred', 'Hope', 'Horror', 'Hostility', 'Homesickness', 'Hunger', 'Hysteria',
    'Interest', 'Loneliness', 'Love', 'Paranoia', 'Pity', 'Pleasure', 'Pride', 'Rage', 'Regret', 'Remorse', 'Shame', 'Suffering',
    'Sympathy'];

test('the palette holds exactly the 42 emotions, in order', () => {
    assert.deepEqual(MOOD_PALETTE.map(row => row.emotion), EMOTIONS);
});

test('every palette instrument is a General MIDI instrument with a shipped sample', () => {
    const named = [
        ...MOOD_PALETTE.flatMap(row => row.flavours.flatMap(item => item.instruments.map(instrument => [row.emotion, instrument]))),
        ...SETTING_PALETTE.flatMap(row => row.instruments.map(instrument => [row.setting, instrument])),
    ];
    for (const [where, instrument] of named) {
        assert.ok(Object.hasOwn(INSTRUMENTS, instrument), `${where}: ${instrument}`);
    }
});

test('every emotion has cues and complete flavours, one old and one new at least', () => {
    for (const row of MOOD_PALETTE) {
        assert.ok(row.cues, row.emotion);
        assert.ok(row.flavours.length >= 2, row.emotion);
        const eras = new Set(row.flavours.map(item => item.era));
        assert.ok(eras.has('modern') || eras.has('electronic'), `${row.emotion}: no modern flavour`);
        assert.ok(eras.has('classic') || eras.has('folk'), `${row.emotion}: no classic or folk flavour`);
        for (const item of row.flavours) {
            assert.ok(PALETTE_ERAS.includes(item.era), `${row.emotion}: era ${item.era}`);
            assert.ok(item.instruments.length >= 3, `${row.emotion} [${item.era}]`);
            for (const field of ['harmony', 'rhythm', 'styles']) {
                assert.ok(typeof item[field] === 'string' && item[field].length > 0, `${row.emotion} [${item.era}]: ${field}`);
            }
        }
    }
});

test('the prompt sections list one line per emotion and per setting', () => {
    const section = moodPaletteToPromptSection();
    assert.ok(section.startsWith('<mood_palette>\n- Acceptance (letting go'));
    assert.ok(section.endsWith('\n</setting_palette>'));
    assert.equal(section.split('\n').length, MOOD_PALETTE.length + SETTING_PALETTE.length + 4);
    assert.match(section, /- Grief \([^)]*\): \[classic\] cello, .* \| \[modern\] electric_guitar_clean/);
    assert.match(section, /- Horror \(.*\| \[contrast\] music_box/);
    assert.match(section, /<setting_palette>\n- old world, fantasy/);
    assert.doesNotMatch(section, /drum_kit/);
});
