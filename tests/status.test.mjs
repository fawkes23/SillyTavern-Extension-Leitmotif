// Tests for status.mjs: the idle texts and the elapsed time.
import assert from 'node:assert/strict';
import test from 'node:test';
import { formatElapsed, getIdleStatus } from '../src/status.mjs';

test('the idle status says whether a theme is ready', () => {
    assert.match(getIdleStatus(true), /Theme ready/);
    assert.match(getIdleStatus(false), /Ready when a character chat is open/);
});

test('elapsed time reads as m:ss', () => {
    assert.equal(formatElapsed(0), '0:00');
    assert.equal(formatElapsed(9999), '0:09');
    assert.equal(formatElapsed(65000), '1:05');
    assert.equal(formatElapsed(-5), '0:00');
});
