// Tests for story.mjs: the recent chat messages the composer reads.
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStoryExcerpt } from '../src/story.mjs';

const chat = [
    { name: 'Ada', is_user: false, mes: 'The harbor is frozen.' },
    { name: 'You', is_user: true, mes: 'I draw my sword.' },
    { name: 'System', is_system: true, mes: 'hidden note' },
    { name: 'Ada', is_user: false, mes: 'She <b>screams</b> & runs.' },
];

test('the last messages are kept in chat order, system and hidden ones left out', () => {
    const story = buildStoryExcerpt(chat, { count: 2 });
    assert.equal(story, '<message speaker="You">I draw my sword.</message>\n<message speaker="Ada">She screams &amp; runs.</message>');
});

test('a count of 0, no chat or empty messages give no story', () => {
    assert.equal(buildStoryExcerpt(chat, { count: 0 }), '');
    assert.equal(buildStoryExcerpt(undefined, { count: 5 }), '');
    assert.equal(buildStoryExcerpt([{ name: 'A', mes: '  ' }], { count: 5 }), '');
});

test('a speaker without a name falls back to the user or character name, escaped', () => {
    const story = buildStoryExcerpt([{ is_user: true, mes: 'hi' }, { is_user: false, mes: 'yo' }], {
        count: 5,
        userName: 'Me "quoted"',
        characterName: 'Vera',
    });
    assert.match(story, /speaker="Me &quot;quoted&quot;"/);
    assert.match(story, /speaker="Vera">yo/);
});

test('a long message keeps its end, and the newest messages win the length cap', () => {
    const long = `${'a'.repeat(2000)} THE END`;
    const story = buildStoryExcerpt([{ name: 'A', mes: long }], { count: 1 });
    assert.ok(story.includes('THE END'));
    assert.ok(story.length < 800);
    const many = Array.from({ length: 40 }, (_, index) => ({ name: 'A', mes: `${index} ${'x'.repeat(690)}` }));
    const capped = buildStoryExcerpt(many, { count: 40 });
    assert.ok(capped.length <= 12000);
    assert.ok(capped.includes('>39 '));
    assert.ok(!capped.includes('>0 '));
    assert.ok(capped.split('\n').length >= 10);
});
