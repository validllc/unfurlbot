// The whole idea of the bot lives in this file. Each entry maps a platform's
// hostnames to an embed-fixing proxy that serves the same post with meta tags
// Discord can actually render. Path and query are kept, only the host changes.
//
// Want another platform? Add a row.

export interface Replacement {
  // hostnames this rule applies to (www./m./mobile. are stripped before matching)
  readonly hosts: readonly string[];
  // the proxy host the link gets rewritten to
  readonly proxy: string;
}

export const replacements: readonly Replacement[] = [
  {
    // Twitter / X
    hosts: ['twitter.com', 'x.com'],
    proxy: 'fxtwitter.com',
  },
  {
    // Instagram
    hosts: ['instagram.com'],
    proxy: 'ddinstagram.com',
  },

  // more services go here, e.g.
  //   { hosts: ['example.com'], proxy: 'fxexample.com' },
  // see the README for where to find proxies for other platforms
];
