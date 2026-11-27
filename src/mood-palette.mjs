// The mood palette: common associations of a mood with instruments, mode and
// harmony, rhythm and styles (a piano in minor reads as sad, a saxophone over
// minor 7ths as sultry, a clean electric guitar as cool). The composer gets
// it as a starting point for the scene and the character, never as a limit.
// Instrument names are General MIDI names from score.mjs INSTRUMENTS.

export const MOOD_PALETTE = Object.freeze([
    {
        moods: 'sad, grief, loss, regret',
        instruments: ['acoustic_grand_piano', 'cello', 'string_ensemble_1', 'oboe', 'english_horn'],
        harmony: 'natural minor, falling bass lines, slow chord changes',
        rhythm: 'sparse, long phrases, soft dynamics',
        styles: 'film elegy, chamber music, slow ballad',
    },
    {
        moods: 'melancholy, nostalgia, bittersweet',
        instruments: ['electric_piano_1', 'acoustic_guitar_steel', 'harmonica', 'accordion', 'vibraphone'],
        harmony: 'major with a borrowed minor iv or bVI, 7th chords',
        rhythm: 'relaxed, medium-slow',
        styles: 'lo-fi, folk, Americana, chanson',
    },
    {
        moods: 'romance, tenderness, intimacy',
        instruments: ['acoustic_guitar_nylon', 'electric_piano_1', 'violin', 'flute', 'string_ensemble_1'],
        harmony: 'major 7ths and 9ths, lydian colour',
        rhythm: 'gentle arpeggios, slow harmonic rhythm',
        styles: 'bossa nova, romantic ballad, film love theme',
    },
    {
        moods: 'sultry, seductive, steamy',
        instruments: ['alto_sax', 'tenor_sax', 'electric_piano_1', 'fretless_bass', 'muted_trumpet'],
        harmony: 'minor 7th and 9th chords, dorian, blue notes',
        rhythm: 'slow swing or a laid-back groove, behind the beat',
        styles: 'smooth jazz, neo-soul, noir lounge',
    },
    {
        moods: 'cool, confident, stylish',
        instruments: ['electric_guitar_clean', 'electric_guitar_jazz', 'electric_bass_finger', 'vibraphone', 'drawbar_organ'],
        harmony: 'dorian or mixolydian, dominant 9ths',
        rhythm: 'syncopated, tight sixteenth-note groove',
        styles: 'funk, cool jazz, acid jazz',
    },
    {
        moods: 'tension, suspense, sneaking',
        instruments: ['tremolo_strings', 'pizzicato_strings', 'contrabass', 'celesta', 'timpani'],
        harmony: 'minor with diminished chords, chromatic lines, pedal tones',
        rhythm: 'a repeated low ostinato, a rising pulse',
        styles: 'thriller score, heist',
    },
    {
        moods: 'dread, horror, the uncanny',
        instruments: ['church_organ', 'choir_aahs', 'music_box', 'contrabass', 'fx_7_echoes', 'pad_6_metallic'],
        harmony: 'phrygian or locrian, clusters, tritones',
        rhythm: 'very sparse, long silences, sudden accents',
        styles: 'horror score, dark ambient',
    },
    {
        moods: 'combat, chase, danger',
        instruments: ['brass_section', 'string_ensemble_1', 'timpani', 'taiko_drum', 'distortion_guitar', 'synth_bass_1'],
        harmony: 'minor or phrygian, power chords (root and fifth)',
        rhythm: 'driving eighths or sixteenths, hard accents, percussive',
        styles: 'epic orchestral, rock, action score',
    },
    {
        moods: 'triumph, heroism, resolve',
        instruments: ['french_horn', 'trumpet', 'brass_section', 'string_ensemble_1', 'timpani'],
        harmony: 'major or mixolydian, rising fourths and fifths, bVII-IV-I',
        rhythm: 'march-like, broad, loud',
        styles: 'fanfare, heroic film score',
    },
    {
        moods: 'joy, playfulness, mischief',
        instruments: ['marimba', 'xylophone', 'pizzicato_strings', 'clarinet', 'glockenspiel', 'banjo'],
        harmony: 'major, pentatonic tunes, quick leaps',
        rhythm: 'bouncy staccato, a skipping swing',
        styles: 'ragtime, folk dance, cartoon score',
    },
    {
        moods: 'wonder, magic, the fantastic',
        instruments: ['celesta', 'orchestral_harp', 'glockenspiel', 'flute', 'pad_7_halo', 'music_box'],
        harmony: 'lydian (major with a raised fourth), shimmering added notes',
        rhythm: 'arpeggiated, floating, light',
        styles: 'fairy tale, fantasy film score',
    },
    {
        moods: 'calm, peace, rest',
        instruments: ['acoustic_guitar_nylon', 'flute', 'orchestral_harp', 'kalimba', 'pad_2_warm'],
        harmony: 'major pentatonic, open fifths, few chord changes',
        rhythm: 'slow, open, few onsets',
        styles: 'ambient, lo-fi, pastoral',
    },
    {
        moods: 'mystery, intrigue',
        instruments: ['vibraphone', 'shakuhachi', 'pan_flute', 'koto', 'pad_8_sweep', 'fretless_bass'],
        harmony: 'dorian, whole-tone colour, suspended chords',
        rhythm: 'unhurried, unexpected rests',
        styles: 'mystery score, noir, ambient jazz',
    },
    {
        moods: 'anger, rage, defiance',
        instruments: ['overdriven_guitar', 'distortion_guitar', 'rock_organ', 'brass_section', 'slap_bass_1'],
        harmony: 'minor, power chords, chromatic riffs',
        rhythm: 'aggressive, heavy downbeats',
        styles: 'hard rock, industrial',
    },
    {
        moods: 'sacred, solemn, ceremony',
        instruments: ['church_organ', 'choir_aahs', 'string_ensemble_2', 'french_horn', 'tubular_bells'],
        harmony: 'dorian or aeolian, suspended chords, plagal (IV-I) cadences',
        rhythm: 'slow, stately',
        styles: 'hymn, chorale',
    },
    {
        moods: 'future, technology, cyberpunk',
        instruments: ['lead_2_sawtooth', 'synth_bass_1', 'pad_3_polysynth', 'lead_1_square', 'fx_8_scifi'],
        harmony: 'minor with suspended chords, arpeggiated synth lines',
        rhythm: 'a steady sixteenth-note pulse',
        styles: 'synthwave, electronic, chiptune',
    },
    {
        moods: 'tavern, adventure, old-world fantasy',
        instruments: ['fiddle', 'recorder', 'accordion', 'harpsichord', 'dulcimer', 'bagpipe'],
        harmony: 'dorian or mixolydian over drones',
        rhythm: 'a lively 3/4 dance or a jig-like lilt',
        styles: 'celtic folk, medieval and renaissance dance',
    },
    {
        moods: 'frontier, wilderness, the open road',
        instruments: ['acoustic_guitar_steel', 'harmonica', 'banjo', 'fiddle', 'acoustic_bass'],
        harmony: 'major or mixolydian, simple I-IV-V',
        rhythm: 'a loping train beat or a slow strum',
        styles: 'western, bluegrass, country',
    },
].map(row => Object.freeze({ ...row, instruments: Object.freeze(row.instruments) })));

// The palette as prompt lines, one per row.
export function moodPaletteToPromptSection(palette = MOOD_PALETTE) {
    const lines = palette.map(row =>
        `- ${row.moods}: ${row.instruments.join(', ')}; ${row.harmony}; ${row.rhythm}; like ${row.styles}.`);
    return `<mood_palette>\n${lines.join('\n')}\n</mood_palette>`;
}
