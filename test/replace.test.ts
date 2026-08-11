import { describe, expect, it } from 'vitest';
import { fixMessage, fixUrl } from '../src/replace.js';

describe('fixUrl', () => {
  it('rewrites twitter and x links to the proxy', () => {
    expect(fixUrl('https://twitter.com/user/status/123')).toBe(
      'https://fxtwitter.com/user/status/123',
    );
    expect(fixUrl('https://x.com/user/status/123')).toBe('https://fxtwitter.com/user/status/123');
  });

  it('rewrites instagram links to the proxy', () => {
    expect(fixUrl('https://www.instagram.com/p/ABC123/')).toBe('https://ddinstagram.com/p/ABC123/');
  });

  it('keeps path and query intact', () => {
    expect(fixUrl('https://x.com/i/status/123?s=20')).toBe(
      'https://fxtwitter.com/i/status/123?s=20',
    );
  });

  it('strips common mobile subdomains before matching', () => {
    expect(fixUrl('https://mobile.twitter.com/user/status/1')).toBe(
      'https://fxtwitter.com/user/status/1',
    );
    expect(fixUrl('https://m.instagram.com/p/XYZ/')).toBe('https://ddinstagram.com/p/XYZ/');
  });

  it('leaves unknown hosts alone', () => {
    expect(fixUrl('https://example.com/whatever')).toBeNull();
    expect(fixUrl('https://nottwitter.com/user')).toBeNull();
  });

  it('strips tracking params off the fixed link', () => {
    expect(fixUrl('https://x.com/user/status/1?utm_source=news&fbclid=abc')).toBe(
      'https://fxtwitter.com/user/status/1',
    );
    expect(fixUrl('https://instagram.com/p/ABC/?igsh=xyz')).toBe('https://ddinstagram.com/p/ABC/');
  });

  it('keeps real query params while dropping tracking ones', () => {
    expect(fixUrl('https://x.com/search?q=cats&utm_medium=share')).toBe(
      'https://fxtwitter.com/search?q=cats',
    );
  });

  it('rejects non-http schemes and non-URLs', () => {
    expect(fixUrl('ftp://x.com/file')).toBeNull();
    expect(fixUrl('not a url')).toBeNull();
  });

  it('trims trailing punctuation from links wrapped in prose', () => {
    expect(fixUrl('https://x.com/user/status/123).')).toBe('https://fxtwitter.com/user/status/123');
    expect(fixUrl('https://instagram.com/p/ABC/!')).toBe('https://ddinstagram.com/p/ABC/');
  });
});

describe('fixMessage', () => {
  it('returns every fixable link in a message', () => {
    const message = 'look https://x.com/a/status/1 and https://instagram.com/p/B/';
    expect(fixMessage(message)).toEqual([
      'https://fxtwitter.com/a/status/1',
      'https://ddinstagram.com/p/B/',
    ]);
  });

  it('ignores messages without fixable links', () => {
    expect(fixMessage('no links here')).toEqual([]);
    expect(fixMessage('https://example.com/only-unknown')).toEqual([]);
  });

  it('de-duplicates repeated links', () => {
    const message = 'https://x.com/a/status/1 https://x.com/a/status/1';
    expect(fixMessage(message)).toEqual(['https://fxtwitter.com/a/status/1']);
  });

  it('skips a link opted out with a leading !', () => {
    expect(fixMessage('!https://x.com/a/status/1')).toEqual([]);
    expect(fixMessage('leave this one ! https://x.com/a/status/1')).toEqual([]);
    expect(fixMessage('!https://x.com/a/status/1 at start of message')).toEqual([]);
  });

  it('does not treat a sentence-ending bang as opt-out', () => {
    expect(fixMessage('so cool! https://x.com/a/status/1')).toEqual([
      'https://fxtwitter.com/a/status/1',
    ]);
  });

  it('opts out one link while still fixing the other', () => {
    const message = '!https://x.com/a/status/1 but fix https://instagram.com/p/B/';
    expect(fixMessage(message)).toEqual(['https://ddinstagram.com/p/B/']);
  });
});
