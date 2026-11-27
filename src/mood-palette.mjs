// The mood palette: common associations of a mood with instruments, harmony,
// rhythm and style, as starting points for the composer, never as limits.
// Each mood names the story cues that point to it and comes in flavours
// tagged by era (classic, folk, modern, electronic, contrast), so a
// present-day scene can sound like lo-fi or trap and a fantasy one like a
// film score. Modern sounds are approximated on the General MIDI palette the
// extension ships (an 808 is a synth bass with long low notes, a Rhodes the
// electric piano, a supersaw the sawtooth lead). Instrument names are names
// from score.mjs INSTRUMENTS.

export const PALETTE_ERAS = Object.freeze(['classic', 'folk', 'modern', 'electronic', 'contrast']);

const flavour = (name, era, instruments, harmony, rhythm, styles) => ({ name, era, instruments, harmony, rhythm, styles });

export const MOOD_PALETTE = Object.freeze([
    {
        mood: 'sadness',
        cues: 'a death, a farewell, tears, regret, loneliness',
        flavours: [
            flavour('quiet grief', 'classic', ['acoustic_grand_piano', 'cello', 'string_ensemble_1', 'english_horn'],
                'natural minor, a falling bass line, slow chord changes', 'sparse, long phrases, soft', 'film elegy, Romantic chamber music'),
            flavour('numb, hollow', 'modern', ['electric_piano_1', 'pad_8_sweep', 'fretless_bass', 'voice_oohs'],
                'minor 9th and suspended chords that never quite resolve', 'slow half-time, a lot of space', 'lo-fi, slowcore, ambient pop'),
            flavour('aching, cathartic', 'modern', ['electric_guitar_clean', 'acoustic_grand_piano', 'string_ensemble_1', 'synth_strings_1'],
                'i-VI-III-VII, voicings opening upward as it grows', 'one repeated figure gaining layers and loudness', 'post-rock, indie film score'),
        ],
    },
    {
        mood: 'melancholy, nostalgia, bittersweet',
        cues: 'memories, home, an old photo, rain, autumn, a reunion',
        flavours: [
            flavour('wistful', 'folk', ['accordion', 'acoustic_guitar_nylon', 'clarinet', 'harmonica'],
                'a minor melody over major chords, a borrowed iv', 'a slow waltz or walking pulse', 'chanson, folk ballad'),
            flavour('hazy memory', 'modern', ['electric_piano_1', 'vibraphone', 'synth_bass_1', 'pad_2_warm'],
                'major 7ths and 9ths, IV-iii-ii-I', 'laid back, lazily swung, a little behind the beat', 'lo-fi hip hop, city pop, chillhop'),
            flavour('faded and bright', 'modern', ['electric_guitar_clean', 'pad_7_halo', 'glockenspiel', 'voice_oohs'],
                'major with suspended 2nds, chords blurred into each other', 'slow, washed, few hard attacks', 'dream pop, shoegaze'),
        ],
    },
    {
        mood: 'romance',
        cues: 'flirting, a confession, a kiss, a date, longing',
        flavours: [
            flavour('tender', 'classic', ['violin', 'acoustic_guitar_nylon', 'flute', 'orchestral_harp', 'string_ensemble_1'],
                'major 7ths, lydian colour', 'gentle arpeggios, slow harmonic rhythm', 'film love theme, bossa nova'),
            flavour('slow burn', 'modern', ['electric_piano_1', 'fretless_bass', 'voice_oohs', 'pad_2_warm'],
                'minor 9ths, ii-V that never lands', 'slow, behind the beat, a soft groove', 'R&B, neo-soul'),
            flavour('giddy crush', 'modern', ['electric_piano_2', 'marimba', 'glockenspiel', 'electric_bass_finger'],
                'bright major, pentatonic hooks, added 6ths', 'bouncy, syncopated', 'bedroom pop, city pop, J-pop'),
        ],
    },
    {
        mood: 'desire, sultry, steamy',
        cues: 'seduction, a dim bar, heat, temptation, a dangerous attraction',
        flavours: [
            flavour('noir', 'classic', ['tenor_sax', 'muted_trumpet', 'acoustic_bass', 'acoustic_grand_piano'],
                'minor 7ths, blue notes, chromatic slides', 'a slow swing', 'noir jazz, torch song'),
            flavour('late night', 'modern', ['alto_sax', 'electric_piano_1', 'synth_bass_1', 'pad_3_polysynth'],
                'dorian minor 9ths', 'a slow half-time groove', '80s slow jam, synthwave sax, contemporary R&B'),
            flavour('dark allure', 'modern', ['synth_bass_2', 'pad_6_metallic', 'lead_6_voice', 'electric_piano_2'],
                'phrygian, low close voicings', 'slow, heavy, sparse', 'dark pop, trip-hop'),
        ],
    },
    {
        mood: 'cool, confident, swagger',
        cues: 'a boast, a plan coming together, style, sizing up a rival',
        flavours: [
            flavour('cool jazz', 'classic', ['vibraphone', 'muted_trumpet', 'acoustic_bass', 'electric_guitar_jazz'],
                'dorian, 9th and 13th chords', 'a light swing over a walking bass', 'cool jazz, 60s spy film'),
            flavour('groove', 'modern', ['electric_guitar_clean', 'slap_bass_1', 'clavinet', 'brass_section'],
                'dominant 9ths, one-chord vamps', 'tight syncopated sixteenths', 'funk, nu-disco'),
            flavour('swagger', 'modern', ['synth_bass_1', 'electric_piano_2', 'lead_1_square', 'pad_3_polysynth'],
                'minor, a two-chord loop', 'half-time, long low bass notes like an 808, sixteenth-note hat rolls when drums play', 'trap, phonk'),
        ],
    },
    {
        mood: 'tension, suspense',
        cues: 'sneaking, a secret, being watched, a countdown, a lie about to unravel',
        flavours: [
            flavour('thriller', 'classic', ['tremolo_strings', 'pizzicato_strings', 'contrabass', 'timpani', 'celesta'],
                'minor with diminished chords, chromatic lines, pedal tones', 'a repeated low ostinato, a rising pulse', 'classic thriller score'),
            flavour('pulse', 'electronic', ['synth_bass_2', 'lead_2_sawtooth', 'pad_8_sweep', 'fx_4_atmosphere'],
                'one held minor chord, the register climbing', 'a steady eighth-note pulse that grows denser', 'modern action-thriller score, darksynth'),
            flavour('caper', 'modern', ['electric_bass_finger', 'electric_guitar_muted', 'brass_section', 'vibraphone'],
                'minor blues', 'tight muted riffs', 'heist film, spy funk'),
        ],
    },
    {
        mood: 'dread, horror, the uncanny',
        cues: 'the dark, a monster, a curse, something wrong with a familiar place',
        flavours: [
            flavour('gothic', 'classic', ['church_organ', 'choir_aahs', 'contrabass', 'tubular_bells'],
                'phrygian or locrian, tritones, clusters', 'very slow, long silences, sudden accents', 'gothic horror score'),
            flavour('creepy innocence', 'contrast', ['music_box', 'celesta', 'glockenspiel', 'pad_6_metallic'],
                'a childlike major tune over a minor or wrong-note drone', 'slow and slightly uneven', 'horror lullaby'),
            flavour('modern dread', 'electronic', ['fx_7_echoes', 'pad_8_sweep', 'synth_bass_2', 'reverse_cymbal'],
                'drones with no clear key, low clusters', 'almost no pulse, slow swells', 'dark ambient, witch house'),
        ],
    },
    {
        mood: 'combat, chase, danger',
        cues: 'a fight, weapons drawn, running, an ambush, a race against time',
        flavours: [
            flavour('epic', 'classic', ['brass_section', 'french_horn', 'string_ensemble_1', 'timpani', 'taiko_drum'],
                'minor or phrygian, power chords (root and fifth)', 'driving eighths, hard accents', 'epic orchestral'),
            flavour('riff', 'modern', ['distortion_guitar', 'overdriven_guitar', 'electric_bass_pick', 'rock_organ'],
                'minor, power chords, chromatic riffs', 'palm-muted eighths, heavy downbeats', 'metal, hard rock'),
            flavour('breakneck', 'electronic', ['synth_bass_2', 'lead_2_sawtooth', 'lead_1_square', 'pad_3_polysynth'],
                'minor, short repeated stabs', 'a fast sixteenth pulse, broken-beat drums when drums play', 'drum and bass, cyberpunk action'),
        ],
    },
    {
        mood: 'triumph, heroism, resolve',
        cues: 'victory, a rescue, a vow, standing up to someone',
        flavours: [
            flavour('fanfare', 'classic', ['french_horn', 'trumpet', 'brass_section', 'string_ensemble_1', 'timpani'],
                'major or mixolydian, rising fourths and fifths, bVII-IV-I', 'march-like, broad, loud', 'heroic film score'),
            flavour('anthem', 'modern', ['electric_guitar_clean', 'synth_strings_1', 'acoustic_grand_piano', 'lead_2_sawtooth'],
                'I-V-vi-IV, a big melody doubled in octaves', 'a four-on-the-floor build', 'stadium pop, EDM anthem'),
            flavour('quiet resolve', 'folk', ['cello', 'acoustic_guitar_steel', 'acoustic_grand_piano', 'french_horn'],
                'major with suspended chords that resolve late', 'a slow steady pulse', 'indie folk, modern film score'),
        ],
    },
    {
        mood: 'joy, playfulness, mischief',
        cues: 'a joke, a game, a party, teasing, a prank',
        flavours: [
            flavour('cartoon', 'classic', ['pizzicato_strings', 'clarinet', 'xylophone', 'bassoon'],
                'major, quick leaps, chromatic grace notes', 'bouncy staccato', 'cartoon score, ragtime'),
            flavour('bright pop', 'modern', ['electric_piano_2', 'synth_bass_1', 'glockenspiel', 'lead_1_square'],
                'major, pentatonic hooks, bright 7ths', 'upbeat, syncopated, sparkly', 'K-pop, city pop, hyperpop'),
            flavour('sunny', 'modern', ['steel_drums', 'marimba', 'acoustic_guitar_steel', 'electric_bass_finger'],
                'major, I-IV-V', 'off-beat accents in a 3+3+2 sixteenth pattern', 'afrobeats, tropical house'),
        ],
    },
    {
        mood: 'wonder, magic, the fantastic',
        cues: 'a spell, the stars, a discovery, a first sight of something vast',
        flavours: [
            flavour('fairy tale', 'classic', ['celesta', 'orchestral_harp', 'flute', 'glockenspiel', 'string_ensemble_1'],
                'lydian (major with a raised fourth)', 'arpeggiated, floating, light', 'fantasy film score'),
            flavour('cosmic', 'electronic', ['pad_7_halo', 'fx_3_crystal', 'synth_strings_2', 'lead_7_fifths'],
                'slow-moving major chords with added 9ths, lydian', 'slow, spacious arpeggios', 'ambient electronic, space synth'),
            flavour('cozy whimsy', 'modern', ['kalimba', 'music_box', 'pizzicato_strings', 'ocarina'],
                'major pentatonic', 'light, skipping', 'cozy game music, indie game score'),
        ],
    },
    {
        mood: 'calm, peace, rest',
        cues: 'a campfire, sleep, a garden, safety after danger',
        flavours: [
            flavour('pastoral', 'classic', ['flute', 'orchestral_harp', 'acoustic_guitar_nylon', 'string_ensemble_1'],
                'major pentatonic, open fifths, few chord changes', 'slow, open', 'pastoral'),
            flavour('lo-fi', 'modern', ['electric_piano_1', 'acoustic_guitar_nylon', 'fretless_bass', 'vibraphone'],
                'major 7ths, ii-V-I', 'a lazy swing, soft', 'lo-fi hip hop, chillhop'),
            flavour('drift', 'electronic', ['pad_2_warm', 'kalimba', 'pad_1_new_age', 'celesta'],
                'one or two chords, no tension', 'almost static', 'ambient, new age'),
        ],
    },
    {
        mood: 'mystery, intrigue',
        cues: 'a clue, a stranger, a locked door, rumours, an old map',
        flavours: [
            flavour('detective', 'classic', ['vibraphone', 'acoustic_bass', 'clarinet', 'muted_trumpet'],
                'minor, chromatic walking lines', 'a slow swing', 'noir, detective film'),
            flavour('enigmatic', 'modern', ['electric_piano_2', 'synth_bass_2', 'pad_8_sweep', 'fx_4_atmosphere'],
                'dorian or whole-tone colour, suspended chords', 'unhurried, unexpected rests', 'trip-hop, ambient jazz'),
            flavour('ancient secret', 'folk', ['pan_flute', 'dulcimer', 'orchestral_harp', 'choir_aahs'],
                'modal drones, dorian', 'free and slow', 'ancient-ruins score'),
        ],
    },
    {
        mood: 'anger, rage, defiance',
        cues: 'shouting, betrayal, a grudge, rebellion',
        flavours: [
            flavour('fury', 'classic', ['string_ensemble_1', 'brass_section', 'timpani', 'contrabass'],
                'minor and diminished, hammered repeated notes', 'accented, relentless', 'dramatic orchestral'),
            flavour('punk', 'modern', ['distortion_guitar', 'electric_bass_pick', 'overdriven_guitar'],
                'power chords, i-bVI-bVII', 'fast straight eighths', 'punk, emo'),
            flavour('industrial', 'electronic', ['synth_bass_2', 'lead_2_sawtooth', 'pad_6_metallic', 'orchestra_hit'],
                'minor, single-note riffs, metallic stabs', 'mechanical sixteenths, heavy downbeats', 'industrial, darksynth'),
        ],
    },
    {
        mood: 'sacred, solemn, ceremony',
        cues: 'a funeral, a temple, an oath, a coronation',
        flavours: [
            flavour('hymn', 'classic', ['church_organ', 'choir_aahs', 'string_ensemble_2', 'tubular_bells'],
                'dorian or aeolian, plagal (IV-I) cadences', 'slow, stately', 'chorale'),
            flavour('processional', 'classic', ['french_horn', 'brass_section', 'timpani', 'choir_aahs'],
                'major or mixolydian, broad suspensions', 'a slow march', 'coronation music'),
            flavour('still devotion', 'modern', ['voice_oohs', 'pad_4_choir', 'acoustic_grand_piano', 'cello'],
                'slowly changing modal chords, much repetition', 'very slow', 'holy minimalism, ambient choral'),
        ],
    },
    {
        mood: 'future, technology',
        cues: 'machines, neon, a city at night, a spaceship, a hacker',
        flavours: [
            flavour('retro-future', 'electronic', ['lead_2_sawtooth', 'synth_bass_1', 'pad_3_polysynth', 'electric_piano_2'],
                'minor with suspended chords, arpeggios', 'a steady sixteenth pulse', 'synthwave'),
            flavour('cold machine', 'electronic', ['lead_1_square', 'synth_bass_2', 'fx_8_scifi', 'pad_6_metallic'],
                'minor, short repeated cells', 'mechanical, exact', 'techno, glitch'),
            flavour('8-bit', 'electronic', ['lead_1_square', 'lead_3_calliope', 'synth_bass_1'],
                'fast major or minor arpeggios', 'quick and busy', 'chiptune'),
        ],
    },
    {
        mood: 'tavern, adventure, the old world',
        cues: 'an inn, a journey, a market, a quest, a feast',
        flavours: [
            flavour('folk dance', 'folk', ['fiddle', 'recorder', 'accordion', 'bagpipe', 'dulcimer'],
                'dorian or mixolydian over drones', 'a lively 3/4 dance or a jig-like lilt', 'celtic folk'),
            flavour('court', 'classic', ['harpsichord', 'recorder', 'string_ensemble_1', 'orchestral_harp'],
                'major, baroque sequences', 'a courtly dance', 'baroque, renaissance dance'),
            flavour('stomp', 'modern', ['acoustic_guitar_steel', 'banjo', 'fiddle', 'acoustic_bass'],
                'mixolydian, shouted unison hooks', 'a stomping four', 'modern folk, folk rock'),
        ],
    },
    {
        mood: 'frontier, wilderness, the open road',
        cues: 'a desert, a horse, a long drive, open sky, exile',
        flavours: [
            flavour('western', 'classic', ['acoustic_guitar_steel', 'harmonica', 'trumpet', 'whistle'],
                'minor or mixolydian, wide leaps', 'loping', 'spaghetti western'),
            flavour('americana', 'folk', ['acoustic_guitar_steel', 'banjo', 'fiddle', 'acoustic_bass'],
                'I-IV-V', 'a train beat', 'bluegrass, country'),
            flavour('night drive', 'modern', ['electric_guitar_clean', 'synth_bass_1', 'pad_2_warm', 'electric_piano_1'],
                'major 7ths', 'steady cruising eighths', 'desert rock, driving synth-pop'),
        ],
    },
].map(row => Object.freeze({
    ...row,
    flavours: Object.freeze(row.flavours.map(item => Object.freeze({ ...item, instruments: Object.freeze(item.instruments) }))),
})));

// The palette as prompt lines: each mood with its cues, then one line per flavour.
export function moodPaletteToPromptSection(palette = MOOD_PALETTE) {
    const lines = palette.flatMap(row => [
        `${row.mood} (${row.cues}):`,
        ...row.flavours.map(item =>
            `- ${item.name} [${item.era}]: ${item.instruments.join(', ')}; ${item.harmony}; ${item.rhythm}; like ${item.styles}.`),
    ]);
    return `<mood_palette>\n${lines.join('\n')}\n</mood_palette>`;
}
