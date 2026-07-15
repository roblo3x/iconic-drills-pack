import assert from 'node:assert/strict';
import test from 'node:test';
import { getAssetPath, getIcon, icons, searchIcons, toCodepoints } from '../dist/index.js';

test('ships only the approved alpha set', () => {
  assert.equal(icons.length, 96);
});

test('looks up an icon by emoji and Unicode id', () => {
  assert.equal(getIcon('🍎')?.id, '1F34E');
  assert.equal(getIcon('1f34e')?.emoji, '🍎');
});

test('normalizes optional variation selectors', () => {
  assert.equal(toCodepoints('☕'), '2615');
  assert.equal(getIcon('☕️')?.id, '2615');
});

test('searches official Unicode names and categories', () => {
  assert.equal(searchIcons('apple')[0]?.emoji, '🍎');
  assert.ok(searchIcons('travel').length > 0);
});

test('returns paths for each distribution format', () => {
  assert.equal(getAssetPath('🍎'), 'illustration/1F34E.svg');
  assert.equal(getAssetPath('🍎', 'emoji-svg'), 'emoji-svg/1F34E.svg');
  assert.equal(getAssetPath('🍎', 'emoji-png', 128), 'emoji-png/128/1F34E.png');
  assert.throws(() => getAssetPath('🍎', 'emoji-png', 64), RangeError);
});
