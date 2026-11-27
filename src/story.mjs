// The recent story the composer reads: the chat's last messages, so a theme
// matches the scene the chat is in, not only the character card. Built from
// SillyTavern's chat array; hidden and system messages are left out.
import { escapeXml } from './xml.mjs';

export const STORY_MESSAGE_LIMITS = Object.freeze({ min: 0, max: 40, default: 10 });
const MAX_MESSAGE_LENGTH = 700;
const MAX_STORY_LENGTH = 7000;

// A message as plain text: markup removed, whitespace collapsed, and a long
// message cut from its start, since its end is where the scene stands now.
function cleanMessage(text) {
    const plain = text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return plain.length > MAX_MESSAGE_LENGTH
        ? `…${plain.slice(plain.length - MAX_MESSAGE_LENGTH).trimStart()}`
        : plain;
}

function escapeAttribute(value) {
    return escapeXml(value).replace(/"/g, '&quot;');
}

// chat: SillyTavern's message array ({ name, is_user, is_system, mes }).
// Returns the last `count` messages as <message speaker="…"> lines in chat
// order, escaped, at most MAX_STORY_LENGTH characters (the newest kept), or ''
// when there is nothing to read.
export function buildStoryExcerpt(chat, { count, userName, characterName } = {}) {
    if (!Array.isArray(chat) || !Number.isInteger(count) || count <= 0) {
        return '';
    }
    const messages = chat
        .filter(message => message && !message.is_system && typeof message.mes === 'string')
        .map(message => ({ message, text: cleanMessage(message.mes) }))
        .filter(({ text }) => text)
        .slice(-count);
    const lines = [];
    let length = 0;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const { message, text } = messages[index];
        const speaker = message.name
            || (message.is_user ? userName || 'User' : characterName || 'Character');
        const line = `<message speaker="${escapeAttribute(speaker)}">${escapeXml(text)}</message>`;
        if (lines.length > 0 && length + line.length > MAX_STORY_LENGTH) {
            break;
        }
        lines.unshift(line);
        length += line.length + 1;
    }
    return lines.join('\n');
}
