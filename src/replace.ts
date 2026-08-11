import { replacements, type Replacement } from './replacements.js';

const URL_PATTERN = /https?:\/\/\S+/gi;

// subdomains that still mean "the same site" for our purposes
const HOST_PREFIX = /^(?:www|m|mobile)\./i;

// The usual junk that gets tacked onto shared links. Not exhaustive, just the
// ones you see over and over. Stripped from every link we rewrite.
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'igshid',
  'igsh',
  'si',
  'mc_cid',
  'mc_eid',
]);

function stripTracking(url: URL): void {
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
}

function ruleFor(hostname: string): Replacement | undefined {
  const host = hostname.toLowerCase().replace(HOST_PREFIX, '');
  return replacements.find((r) => r.hosts.includes(host));
}

// Rewrite one URL to its proxy. Returns null when we have no rule for it
// (or when it doesn't parse at all).
export function fixUrl(raw: string): string | null {
  // people love wrapping links in punctuation: "(see https://x.com/...)"
  const trimmed = raw.replace(/[).,!?;:\]]+$/, '');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const rule = ruleFor(url.hostname);
  if (rule === undefined) return null;

  url.hostname = rule.proxy;
  stripTracking(url);
  return url.toString();
}

// A `!` right before a link opts it out: the bot leaves that one alone so
// whatever Discord does with it natively stays. Works glued (`!https://...`)
// or with a space (`! https://...`, because phones stick a space in when you
// paste after typed text). A bang that's part of a word ("nice! https://...")
// doesn't count, only a standalone one. Learned that the hard way.
function optedOut(content: string, urlStart: number): boolean {
  if (content[urlStart - 1] === '!') return true;
  let i = urlStart - 1;
  while (content[i] === ' ') i--;
  return content[i] === '!' && (i === 0 || /\s/.test(content[i - 1] ?? ''));
}

// Pull every URL out of a message and return the fixed versions of the ones
// we know, deduped, in order.
export function fixMessage(content: string): string[] {
  const fixed = new Set<string>();
  for (const match of content.matchAll(URL_PATTERN)) {
    if (optedOut(content, match.index)) continue;
    const result = fixUrl(match[0]);
    if (result !== null) fixed.add(result);
  }
  return [...fixed];
}
