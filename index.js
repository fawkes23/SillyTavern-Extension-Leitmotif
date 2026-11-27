// Leitmotif's SillyTavern wiring: the settings panel, the toolbar buttons, the
// two model calls and the generation flow; the logic lives in src/.
import { generateRaw, saveSettingsDebounced } from '../../../../script.js';
import {
    extension_settings,
    getContext,
    renderExtensionTemplateAsync,
} from '../../../extensions.js';
import {
    getApproximateDuration,
    getLoopBars,
    METERS,
    parseScore,
    SCORE_JSON_SCHEMA,
} from './src/score.mjs';
import {
    BRIEF_JSON_SCHEMA,
    BRIEF_RESPONSE_LENGTH,
    createBriefCache,
    getBriefPrompt,
    parseBrief,
    sampleVarietySeed,
    VARIETY_LEVELS,
} from './src/brief.mjs';
import { buildCharacterProfile } from './src/character.mjs';
import { COMPOSER_SYSTEM_PROMPT, getComposerPrompt, getComposerRetryPrompt, getScoreResponseLength } from './src/composer.mjs';
import { downloadScoreAsMidi } from './src/midi-export.mjs';
import { createPlayback } from './src/playback.mjs';
import { createScriptLoader } from './src/script-loader.mjs';
import { formatElapsed, getIdleStatus } from './src/status.mjs';
import { buildStoryExcerpt, STORY_MESSAGE_LIMITS } from './src/story.mjs';

const MODULE = 'leitmotif';
const LEGACY_MODULE = 'vibeComposerMidi';
const EXT_DIR = 'third-party/SillyTavern-Extension-Leitmotif';
const LOG_TAG = '[Leitmotif]';
// Everything the extension needs at runtime ships inside its own folder — the
// vendored libraries in lib/ and the FluidR3 samples in samples/ — so a normal
// git install from GitHub is fully self-contained and works offline.
const EXT_URL = new URL('./', import.meta.url);
const AVAILABLE_LENGTHS_SECONDS = [15, 30, 60, 90, 120];
const DEFAULT_SETTINGS = {
    enabled: true,
    lengthSeconds: 30,
    tempo: 74,
    characterTempo: true,
    variety: 'standard',
    storyMessages: STORY_MESSAGE_LIMITS.default,
    volume: 80,
};


let currentScore;
let currentCharacterName = 'character';
let generating = false;
// A theme that arrived while the browser still blocked audio (iOS outside a
// tap): the toolbar button offers to play it, and the next tap starts it.
let pendingPlay = false;
// The status line while generating: a message and the time since the tap.
let progressTimer;
let progressMessage = '';
let progressStartedAt = 0;
const loadMidiWriter = createScriptLoader(new URL('lib/midiwriter.js', EXT_URL).href, 'MidiWriter');
const playback = createPlayback({
    soundfontUrl: new URL('lib/soundfont-player.min.js', EXT_URL).href,
    sampleUrlBase: new URL('samples/', EXT_URL),
    logTag: LOG_TAG,
    onStop: () => {
        updateToolbar();
        updateStatus(getIdleStatus(Boolean(currentScore)));
    },
    onStateChange: reason => {
        updateToolbar();
        if (!playback.isActive()) {
            return;
        }
        if (reason === 'interrupted') {
            updateStatus('Audio was interrupted. Choose Resume Theme in the Extensions menu to continue.');
        } else if (reason === 'blocked') {
            updateStatus('The browser is still blocking audio. Choose Resume Theme again.');
        } else {
            updateStatus(playback.isPaused()
                ? `Paused ${currentCharacterName}'s theme.`
                : `Playing ${currentCharacterName}'s looping theme.`);
        }
    },
});

// Volume 0-100 as gain, on a square curve so the slider feels even to the ear.
function applyVolume() {
    const percent = extension_settings[MODULE].volume;
    playback.setVolume((percent / 100) ** 2);
}

function loadSettings() {
    if (extension_settings[MODULE] === undefined && extension_settings[LEGACY_MODULE] !== undefined) {
        // Carry settings over from the extension's previous name.
        extension_settings[MODULE] = extension_settings[LEGACY_MODULE];
        delete extension_settings[LEGACY_MODULE];
    }
    extension_settings[MODULE] = Object.assign(
        {},
        DEFAULT_SETTINGS,
        extension_settings[MODULE] ?? {},
    );
    const settings = extension_settings[MODULE];
    // Remove settings from the removed MIDI playback mode and instrument pins.
    delete settings.playbackMode;
    delete settings.midiOutput;
    delete settings.instruments;
    if (!AVAILABLE_LENGTHS_SECONDS.includes(settings.lengthSeconds)) {
        settings.lengthSeconds = DEFAULT_SETTINGS.lengthSeconds;
    }
    if (!Number.isInteger(settings.tempo) || settings.tempo < 50 || settings.tempo > 130) {
        settings.tempo = DEFAULT_SETTINGS.tempo;
    }
    settings.characterTempo = settings.characterTempo === true;
    if (!VARIETY_LEVELS.includes(settings.variety)) {
        settings.variety = DEFAULT_SETTINGS.variety;
    }
    if (!Number.isInteger(settings.storyMessages)
        || settings.storyMessages < STORY_MESSAGE_LIMITS.min
        || settings.storyMessages > STORY_MESSAGE_LIMITS.max) {
        settings.storyMessages = DEFAULT_SETTINGS.storyMessages;
    }
    if (!Number.isInteger(settings.volume) || settings.volume < 0 || settings.volume > 100) {
        settings.volume = DEFAULT_SETTINGS.volume;
    }
    applyVolume();
}

function updateLengthEstimate() {
    const tempo = extension_settings[MODULE].tempo;
    const seconds = extension_settings[MODULE].lengthSeconds;
    if (extension_settings[MODULE].characterTempo) {
        $('#st_leitmotif_length_estimate').text(
            `New themes will be about ${seconds} seconds long; tempo and meter come from the character`,
        );
        return;
    }
    const bars = getLoopBars(seconds, tempo);
    const actualSeconds = getApproximateDuration(bars, tempo);
    $('#st_leitmotif_length_estimate').text(
        `New themes will be about ${actualSeconds} seconds long (${bars} bars) at the selected tempo`,
    );
}

// Confirmation shown inside the tempo block so the feedback sits next to the
// control that caused it instead of the status line further down.
function updateTempoFeedback() {
    $('#st_leitmotif_tempo_feedback').text(extension_settings[MODULE].characterTempo
        ? 'New themes will take their tempo from the character.'
        : `New themes will use ${extension_settings[MODULE].tempo} BPM.`);
}

function getStoryLabel(count) {
    if (count === 0) {
        return 'off (card only)';
    }
    return count === 1 ? '1 message' : `${count} messages`;
}

function updateBriefPreview(brief) {
    const body = document.getElementById('st_leitmotif_brief_body');
    if (!body) {
        return;
    }
    if (!brief) {
        body.textContent = 'No analysis yet.';
        return;
    }
    const lines = [
        brief.backdrop && `Backdrop — ${brief.backdrop}`,
        brief.action && `Action — ${brief.action}`,
        brief.twist && `Twist — ${brief.twist}`,
        brief.traits.length > 0 && `Traits — ${brief.traits.join(', ')}`,
        brief.arc && `Arc — ${brief.arc}`,
        [brief.era, ...brief.genreReferences].some(Boolean) && `Style — ${[brief.era, ...brief.genreReferences].filter(Boolean).join('; ')}`,
        `Language — ${[brief.key, brief.mode, brief.feel, brief.meter, brief.tempo ? `${brief.tempo} BPM` : '', brief.density].filter(Boolean).join(', ')}`,
        brief.energyCurve.length > 0 && `Energy — ${brief.energyCurve.join(' -> ')}`,
        brief.motif && `Motif — ${brief.motif.notes.join(' ')} (beats ${brief.motif.rhythm.join(' ')})${brief.motif.character ? `: ${brief.motif.character}` : ''}`,
        brief.surprise && `Surprise — ${brief.surprise}`,
    ].filter(Boolean);
    body.textContent = lines.join('\n');
}

function getActiveCharacter() {
    const context = getContext();
    if (context.characterId === undefined || context.characterId === null) {
        throw new Error('Open an individual character chat before generating a theme.');
    }

    const character = context.characters[context.characterId];
    if (!character) {
        throw new Error('The active character card could not be found.');
    }

    return buildCharacterProfile(character, context.name1);
}

function getMenuButtonHtml(icon, label) {
    return `<div class="fa-solid ${icon} extensionsMenuExtensionButton" aria-hidden="true"></div><span>${label}</span>`;
}

function getMenuButton(id, title, icon, action) {
    const button = document.createElement('div');
    button.id = id;
    button.className = 'list-group-item flex-container flexGap5 interactable';
    button.title = title;
    button.setAttribute('role', 'button');
    button.tabIndex = 0;
    button.setAttribute('aria-label', title);
    button.innerHTML = getMenuButtonHtml(icon, title);
    button.addEventListener('click', action);
    button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    });
    return button;
}

// Sets a menu button's icon, label and title for a state, rebuilding its
// content only when the state changes.
function presentButton(button, state, { icon, title, label }) {
    button.title = title;
    button.setAttribute('aria-label', title);
    if (button.dataset.state !== state) {
        button.dataset.state = state;
        button.innerHTML = getMenuButtonHtml(icon, label);
    }
}

function updateToolbar() {
    const button = document.getElementById('st_leitmotif_toggle');
    const pauseButton = document.getElementById('st_leitmotif_pause');
    const enabled = extension_settings[MODULE]?.enabled === true;

    if (button) {
        const state = generating
            ? 'generating'
            : playback.isActive() ? 'playing' : pendingPlay ? 'ready' : 'idle';
        const presentation = {
            generating: { icon: 'fa-spinner extensionsMenuExtensionButton st-leitmotif-spinner', title: 'Generating theme', label: 'Generating Theme' },
            playing: { icon: 'fa-stop extensionsMenuExtensionButton', title: 'Stop theme', label: 'Stop Theme' },
            ready: { icon: 'fa-play extensionsMenuExtensionButton', title: 'Play theme', label: 'Play Theme' },
            idle: { icon: 'fa-music extensionsMenuExtensionButton', title: 'Generate theme', label: 'Generate Theme' },
        }[state];

        button.hidden = !enabled;
        button.setAttribute('aria-disabled', String(state === 'generating'));
        button.tabIndex = state === 'generating' ? -1 : 0;
        button.setAttribute('aria-busy', String(state === 'generating'));
        presentButton(button, state, presentation);
    }

    if (pauseButton) {
        const paused = playback.isPaused();
        pauseButton.hidden = !enabled || generating || !playback.isActive();
        presentButton(pauseButton, paused ? 'paused' : 'playing', paused
            ? { icon: 'fa-play extensionsMenuExtensionButton', title: 'Resume theme', label: 'Resume Theme' }
            : { icon: 'fa-pause extensionsMenuExtensionButton', title: 'Pause theme', label: 'Pause Theme' });
    }
}

function updateStatus(message) {
    const status = document.querySelector('.st-leitmotif-status');
    if (status) {
        status.textContent = message;
        status.setAttribute('aria-live', 'polite');
    }
}

function renderProgress() {
    if (progressMessage) {
        updateStatus(`${progressMessage} ${formatElapsed(Date.now() - progressStartedAt)}`);
    }
}

function startProgress() {
    stopProgress();
    progressStartedAt = Date.now();
    progressTimer = setInterval(renderProgress, 1000);
}

function setProgress(message) {
    progressMessage = message;
    renderProgress();
}

function stopProgress() {
    clearInterval(progressTimer);
    progressTimer = undefined;
    progressMessage = '';
}

function updateToolbarButtons() {
    const menu = document.getElementById('extensionsMenu');
    if (!menu || !extension_settings[MODULE]?.enabled) {
        document.getElementById('st_leitmotif_toggle')?.remove();
        document.getElementById('st_leitmotif_pause')?.remove();
        return;
    }

    let container = document.getElementById('st_leitmotif_wand_container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'st_leitmotif_wand_container';
        container.className = 'extension_container';
        menu.append(container);
    }
    if (!document.getElementById('st_leitmotif_toggle')) {
        container.append(getMenuButton('st_leitmotif_toggle', 'Generate Theme', 'fa-music', handleToolbarClick));
    }
    if (!document.getElementById('st_leitmotif_pause')) {
        const pauseButton = getMenuButton('st_leitmotif_pause', 'Pause Theme', 'fa-pause', handlePauseClick);
        pauseButton.hidden = true;
        container.append(pauseButton);
    }
    updateToolbar();
}

function setupToolbarObserver() {
    const observer = new MutationObserver(updateToolbarButtons);
    const menu = document.getElementById('extensionsMenu');
    if (menu) {
        observer.observe(menu, { childList: true, subtree: true });
    } else {
        observer.observe(document.body, { childList: true, subtree: true });
    }
    updateToolbarButtons();
}

function handleToolbarClick() {
    if (playback.isActive()) {
        playback.stop();
        return;
    }
    if (generating) {
        return;
    }
    // Unlock audio inside the tap itself, before any await: iOS refuses to
    // start audio later, once the model calls have finished.
    playback.unlock();
    if (pendingPlay && currentScore) {
        playPendingTheme();
        return;
    }
    handleGenerateClick();
}

function handlePauseClick() {
    if (!playback.isActive()) {
        return;
    }
    if (playback.isPaused()) {
        // Inside the tap, as on iOS a resume must be.
        playback.unlock();
        playback.resume();
    } else {
        playback.pause();
    }
}

function reportFailure(error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(LOG_TAG, 'Theme generation or playback failed:', error);
    stopProgress();
    updateStatus(getIdleStatus(Boolean(currentScore)));
    toastr.error(detail, 'Leitmotif', { timeOut: 12000, extendedTimeOut: 2000 });
}

// Plays a score, or, while the browser still blocks audio, leaves it waiting
// behind the Play Theme button for the user's next tap.
async function startPlayback(score) {
    if (!await playback.ensureAudioContext()) {
        console.warn(LOG_TAG, 'The browser has not allowed audio yet; waiting for a tap to play the theme.');
        pendingPlay = true;
        updateToolbar();
        updateStatus('Theme ready. Choose Play Theme in the Extensions menu to hear it.');
        return;
    }
    pendingPlay = false;
    updateStatus('Theme generated. Loading sampled instruments…');
    await playback.play(score, {
        onLoading: () => {
            updateToolbar();
            updateStatus('Loading instrument samples…');
        },
        onStarted: () => {
            updateStatus(`Playing ${currentCharacterName}'s looping theme.`);
            updateToolbar();
        },
    });
}

async function playPendingTheme() {
    try {
        await startPlayback(currentScore);
    } catch (error) {
        reportFailure(error);
    } finally {
        updateToolbar();
    }
}

const briefCache = createBriefCache();

// Stage 1 of a generation: turn the character card into a music brief. Cached
// per character and tempo hint so repeat generations pay for composition
// only; a failed analysis is not cached, so the next theme asks again.
async function analyzeCharacter(character) {
    const tempoHint = extension_settings[MODULE].characterTempo ? null : extension_settings[MODULE].tempo;
    if (briefCache.has(character, tempoHint)) {
        const cached = briefCache.get(character, tempoHint);
        updateBriefPreview(cached);
        return cached;
    }
    setProgress(`Analyzing ${character.name}'s musical identity…`);
    const prompt = getBriefPrompt(character, { tempoHint });
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await generateRaw({
            prompt: attempt === 0
                ? prompt
                : `${prompt}\n\nYour previous attempt was not valid JSON. Return a complete, compact music brief object only. Do not use markdown or omit closing brackets.`,
            systemPrompt: 'You are a music analyst. Return valid JSON only, following the requested brief schema exactly.',
            responseLength: BRIEF_RESPONSE_LENGTH,
            jsonSchema: {
                name: 'music_brief',
                description: 'Music brief capturing the character\'s musical identity.',
                value: BRIEF_JSON_SCHEMA,
                strict: true,
                returnInvalid: true,
            },
        });
        const brief = parseBrief(response);
        if (brief) {
            briefCache.set(character, tempoHint, brief);
            updateBriefPreview(brief);
            return brief;
        }
        console.warn(LOG_TAG, 'The model returned malformed brief JSON; retrying once.');
    }
    updateBriefPreview(null);
    return null;
}

// The chat's recent messages for the composer, as many as the setting asks.
function getRecentStory(character) {
    const context = getContext();
    return buildStoryExcerpt(context.chat, {
        count: extension_settings[MODULE].storyMessages,
        userName: context.name1,
        characterName: character.name,
    });
}

async function handleGenerateClick() {
    if (generating) {
        return;
    }

    generating = true;
    pendingPlay = false;
    updateToolbar();
    startProgress();

    try {
        const character = getActiveCharacter();
        currentCharacterName = character.name;
        const brief = await analyzeCharacter(character);
        const tempo = extension_settings[MODULE].characterTempo && brief?.tempo
            ? brief.tempo
            : extension_settings[MODULE].tempo;
        const meter = brief?.meter ?? '4/4';
        const bars = getLoopBars(extension_settings[MODULE].lengthSeconds, tempo, meter);
        const loopBeats = bars * METERS[meter];
        const varietySeed = sampleVarietySeed(extension_settings[MODULE].variety);
        const story = getRecentStory(character);
        setProgress(story
            ? `Composing ${character.name}'s theme for the current scene…`
            : `Generating a theme for ${character.name}…`);
        const prompt = getComposerPrompt(character, {
            brief,
            bars,
            loopBeats,
            tempo,
            meter,
            varietySeed,
            story,
        });
        const parseOptions = {
            loopBeats,
            meter,
            targetTempo: tempo,
            feel: brief?.feel,
        };
        let score;
        let failureReason = '';
        let responseLength = getScoreResponseLength(bars);
        for (let attempt = 0; attempt < 2; attempt += 1) {
            let response;
            try {
                response = await generateRaw({
                    prompt: failureReason ? getComposerRetryPrompt(prompt, failureReason) : prompt,
                    systemPrompt: COMPOSER_SYSTEM_PROMPT,
                    responseLength,
                    jsonSchema: {
                        name: 'leitmotif_score',
                        description: 'Looping character theme score, one compact string per bar.',
                        value: SCORE_JSON_SCHEMA,
                        strict: true,
                        returnInvalid: true,
                    },
                });
            } catch (error) {
                // Some models cap their reply at 8K tokens and refuse a larger
                // request: ask once more within that cap.
                if (attempt === 1 || responseLength <= 8000) {
                    throw error;
                }
                console.warn(LOG_TAG, 'The score request failed; retrying once with a reply limit of 8000 tokens.', error);
                responseLength = 8000;
                continue;
            }
            try {
                score = parseScore(response, parseOptions);
                break;
            } catch (error) {
                if (attempt === 1) {
                    throw error;
                }
                failureReason = error instanceof Error ? error.message : String(error);
                console.warn(LOG_TAG, 'The generated score did not parse; retrying once with the error.', error);
            }
        }

        currentScore = score;
        $('#st_leitmotif_download').prop('disabled', false);
        stopProgress();
        await startPlayback(score);
    } catch (error) {
        reportFailure(error);
    } finally {
        stopProgress();
        generating = false;
        updateToolbar();
    }
}

function downloadMidi() {
    if (!currentScore) {
        toastr.warning('Generate a theme before downloading MIDI.', 'Leitmotif');
        return;
    }

    const score = currentScore;
    const characterName = currentCharacterName;
    loadMidiWriter().then(MidiWriter => {
        downloadScoreAsMidi(MidiWriter, score, characterName);
    }).catch(error => {
        console.error(LOG_TAG, 'MIDI export failed:', error);
        const detail = error instanceof Error ? error.message : String(error);
        updateStatus(getIdleStatus(Boolean(currentScore)));
        toastr.error(detail, 'Leitmotif', { timeOut: 12000, extendedTimeOut: 2000 });
    });
}

function bindSettings() {
    $('#st_leitmotif_enabled')
        .prop('checked', extension_settings[MODULE].enabled)
        .on('change', function () {
            extension_settings[MODULE].enabled = Boolean($(this).prop('checked'));
            saveSettingsDebounced();
            if (!extension_settings[MODULE].enabled) {
                playback.stop();
            }
            updateToolbarButtons();
        });
    $('#st_leitmotif_download').on('click', downloadMidi);

    $('#st_leitmotif_tempo')
        .val(extension_settings[MODULE].tempo)
        .on('input change', function () {
            const tempo = Number(this.value);
            extension_settings[MODULE].tempo = tempo;
            $('#st_leitmotif_tempo_value').text(`${tempo} BPM`);
            saveSettingsDebounced();
            updateLengthEstimate();
            updateTempoFeedback();
        });
    $('#st_leitmotif_tempo_value').text(`${extension_settings[MODULE].tempo} BPM`);
    $('#st_leitmotif_tempo').prop('disabled', extension_settings[MODULE].characterTempo);

    $('#st_leitmotif_character_tempo')
        .prop('checked', extension_settings[MODULE].characterTempo)
        .on('change', function () {
            extension_settings[MODULE].characterTempo = Boolean($(this).prop('checked'));
            saveSettingsDebounced();
            $('#st_leitmotif_tempo').prop('disabled', extension_settings[MODULE].characterTempo);
            updateLengthEstimate();
            updateTempoFeedback();
        });

    $('#st_leitmotif_story_messages')
        .val(extension_settings[MODULE].storyMessages)
        .on('input change', function () {
            const count = Number(this.value);
            extension_settings[MODULE].storyMessages = count;
            $('#st_leitmotif_story_messages_value').text(getStoryLabel(count));
            saveSettingsDebounced();
        });
    $('#st_leitmotif_story_messages_value').text(getStoryLabel(extension_settings[MODULE].storyMessages));

    $('#st_leitmotif_volume')
        .val(extension_settings[MODULE].volume)
        .on('input change', function () {
            extension_settings[MODULE].volume = Number(this.value);
            $('#st_leitmotif_volume_value').text(`${extension_settings[MODULE].volume}%`);
            applyVolume();
            saveSettingsDebounced();
        });
    $('#st_leitmotif_volume_value').text(`${extension_settings[MODULE].volume}%`);

    $('#st_leitmotif_variety')
        .val(extension_settings[MODULE].variety)
        .on('change', function () {
            extension_settings[MODULE].variety = $(this).val();
            saveSettingsDebounced();
        });

    $('.st-leitmotif-length').each(function () {
        const selected = Number($(this).attr('data-seconds')) === extension_settings[MODULE].lengthSeconds;
        $(this).attr('aria-pressed', String(selected));
    }).on('click', function () {
        extension_settings[MODULE].lengthSeconds = Number($(this).attr('data-seconds'));
        $('.st-leitmotif-length').attr('aria-pressed', 'false');
        $(this).attr('aria-pressed', 'true');
        saveSettingsDebounced();
        updateLengthEstimate();
    });
    updateLengthEstimate();
    updateTempoFeedback();
}

jQuery(async () => {
    loadSettings();
    // Back from another app, a call or a locked screen: pick the theme up again.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            playback.recover();
        }
    });
    try {
        const html = await renderExtensionTemplateAsync(EXT_DIR, 'settings');
        $('#extensions_settings2').append(html);
        bindSettings();
        setupToolbarObserver();
    } catch (error) {
        console.error(LOG_TAG, 'Extension initialization failed:', error);
        toastr.error(error.message || String(error), 'Leitmotif');
    }
});
