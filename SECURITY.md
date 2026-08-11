# Security

If you found something security-relevant, please don't open a public issue.
Ping me on the [support server](https://invite.unfurl.bot) instead and
I'll get on it. There's no bounty program, just a small bot and my genuine
gratitude.

Worth knowing about the design itself: the bot never follows links or talks
to the platforms. It only rewrites message text, so the attack surface is
pretty much the Discord gateway connection and whatever you put in the
replacement list.
