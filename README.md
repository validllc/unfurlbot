# unfurl

[![add to discord](https://img.shields.io/badge/discord-add_the_bot-5865F2.svg)](https://add.unfurl.bot)
[![CI](https://github.com/validllc/unfurlbot/actions/workflows/ci.yml/badge.svg)](https://github.com/validllc/unfurlbot/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![node: >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)
[![proxy health](https://img.shields.io/badge/proxy_health-monitored-0fa98e.svg)](https://status.unfurl.bot)
[![servers](https://top.gg/api/widget/servers/1477101852079161435.svg)](https://top.gg/bot/1477101852079161435)
[![support](https://img.shields.io/badge/discord-support_server-5865F2.svg)](https://invite.unfurl.bot)

A small Discord bot that fixes social media embeds.

> [!TIP]
> If you just want working embeds in your server, [invite the bot I already
> run](https://add.unfurl.bot).
> It's free and covers 18+ platforms. The big win over self-hosting is that
> you never touch the proxy list. Embed proxies die constantly, and the
> hosted bot notices and swaps to a working one on its own. Those health
> checks are public, you can watch them at
> [status.unfurl.bot](https://status.unfurl.bot). Details at
> [unfurl.bot](https://unfurl.bot).
>
> This repo is the core of it. I kept it small on purpose so you can actually
> read it.

## Why this exists

I built this for my own servers. Half of what my friends and I post is
links, and Discord's previews for a bunch of sites are just broken. X links
won't play video, half an Instagram album is missing, and some sites don't
embed at all. Everyone was opening everything in the browser, which defeats
the point of posting it in chat.

The community runs embed-fixing proxies that solve exactly this. Same post,
served with meta tags Discord can actually render. Which makes the fix
almost embarrassingly simple: the bot just reposts your link with the
hostname swapped to the proxy.

```
someone posts   https://x.com/user/status/123
the bot replies https://fxtwitter.com/user/status/123
```

On the way through it also drops the obvious tracking junk (`utm_*`,
`fbclid`, `igshid`, `si`, and the like) so the reposted link is clean.

A few other niceties it picked up from me actually using it:

- It hides the broken embed on the original message so you don't see two
  previews (needs the Manage Messages permission; without it you just see
  both).
- Edit the link out of your message, or delete the message, and it deletes
  its own reply so nothing's left dangling.
- Don't want a particular link touched? Put a `!` in front of it
  (`!https://x.com/...`) and it skips that one.

## Running it

You need Node 20 or newer.

```sh
git clone https://github.com/validllc/unfurlbot.git
cd unfurlbot
npm ci
cp .env.example .env    # put your bot token in here
npm run build
npm start
```

The token comes from the [Discord developer portal](https://discord.com/developers/applications).
Create an application there, add a bot to it, and make sure the **Message
Content** intent is enabled, since the bot can't see links without it.

Invite it with the `bot` scope and only these permissions (it never needs
admin, be suspicious of bots that ask):

- **View Channels** + **Read Message History**: to see the links people post
- **Send Messages**: to reply with the fixed link
- **Embed Links**: without this the reply won't unfurl, which defeats the point
- **Manage Messages**: optional, only used to hide the broken embed on the
  original message. Leave it off and you just see both previews.

`npm run dev` gives you watch mode, and `npm run verify` runs the same
checks CI does.

There's also a Dockerfile, because that's how I actually run it:

```sh
docker build -t unfurlbot .
docker run -d --restart unless-stopped -e DISCORD_TOKEN=... unfurlbot
```

## Adding platforms

Everything lives in [`src/replacements.ts`](src/replacements.ts), one entry
per platform:

```ts
{ hosts: ['example.com'], proxy: 'fxexample.com' },
```

I ship Twitter/X and Instagram as examples. There are community proxies for
a lot more (Reddit, TikTok, Bluesky, Pixiv, and so on). Search "fix embed"
plus the platform name, or start at [FxEmbed](https://github.com/FxEmbed/FxEmbed)
and [InstaFix](https://github.com/Wikidepia/InstaFix). Anything that mirrors
the original URL path works as a row here.

Fair warning: these proxies come and go. If a link stops embedding, the
proxy probably died and you get to find a new one and redeploy. That
maintenance treadmill is honestly the main thing the hosted bot does for
you. The code was the easy part.

## Relation to unfurl.bot

The hosted bot started as exactly this, running for my own servers. Then
proxies kept dying and I kept fixing the list, friends wanted it in their
servers too, and at some point it made more sense to open it up than to
keep explaining how to self-host it. [unfurl.bot](https://unfurl.bot) is
this mechanism plus everything that grew around it over time. Each platform
has a pool of proxies with health checks, so a dead one gets swapped
automatically instead of by me at 2am. Servers can turn individual
platforms on and off. The tracking cleanup is a lot more thorough, and it
unrolls shortened links before fixing them. None of that changes what you
see in `src/replace.ts`. It's the same hostname swap, just with someone
(me) on the hook for keeping the list current.

And since people reasonably ask how a free bot pays for itself: it doesn't
have to. Swapping hostnames in Discord messages is cheap enough that the
whole thing fits in the free tiers of the services it runs on. There are no
ads and I'm not selling anything, least of all your data. It costs me close
to nothing, so it costs you nothing.

## Credits

The bot is a hostname swapper. The actual embed magic is the proxies, which
are community projects doing the hard part: [FxEmbed](https://github.com/FxEmbed/FxEmbed)
for Twitter/X and [InstaFix](https://github.com/Wikidepia/InstaFix) for
Instagram in this repo's default list, and many more like them for other
platforms. If the fixed embeds make your server nicer, they're the ones to
thank (and sponsor).

## License

[MIT](LICENSE). Do whatever you want with it.

Questions, dead proxies, ideas: [issues](https://github.com/validllc/unfurlbot/issues)
or the [support server](https://invite.unfurl.bot).
