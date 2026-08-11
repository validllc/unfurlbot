import {
  Client,
  GatewayIntentBits,
  Message,
  MessageFlags,
  Partials,
  PermissionFlagsBits,
} from 'discord.js';
import { loadEnv } from './env.js';
import { fixMessage } from './replace.js';

let env;
try {
  env = loadEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  // Partial.Message lets us hear edit/delete events for messages that have
  // fallen out of discord.js's own cache (see the reply cleanup below).
  partials: [Partials.Message],
});

// Remember which reply we posted for each source message, so we can clean it
// up if the original gets edited to remove the link, or deleted. Bounded,
// because we only care about recent messages and it must not grow forever.
const replies = new Map<string, Message>();
const MAX_TRACKED = 1000;

function remember(sourceId: string, reply: Message): void {
  replies.set(sourceId, reply);
  if (replies.size > MAX_TRACKED) {
    const oldest = replies.keys().next().value;
    if (oldest !== undefined) replies.delete(oldest);
  }
}

async function dropReply(sourceId: string): Promise<void> {
  const reply = replies.get(sourceId);
  if (reply === undefined) return;
  replies.delete(sourceId);
  try {
    await reply.delete();
  } catch {
    // already gone, fine
  }
}

// Hide the broken embed on the original message so the channel doesn't show
// two previews. Only possible with Manage Messages; without it the original
// embed just stays and that's fine.
async function suppressEmbeds(message: Message): Promise<void> {
  if (!message.inGuild()) return;
  const me = message.guild.members.me;
  if (me === null) return;
  const permissions = message.channel.permissionsFor(me);
  if (!permissions.has(PermissionFlagsBits.ManageMessages)) return;
  try {
    await message.suppressEmbeds(true);
  } catch {
    // message got deleted in the meantime, nothing to do
  }
}

client.on('messageCreate', (message) => {
  // the listener itself has to be sync (no-misused-promises), hence the dance
  void (async () => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    const fixed = fixMessage(message.content);
    if (fixed.length === 0) return;

    const reply = await message.reply({
      content: fixed.join('\n'),
      allowedMentions: { repliedUser: false },
      flags: MessageFlags.SuppressNotifications,
    });
    remember(message.id, reply);
    await suppressEmbeds(message);
  })().catch((error: unknown) => {
    console.error('failed to handle message:', error);
  });
});

// Edited the link out of your message? Drop our now-pointless reply.
client.on('messageUpdate', (_oldMessage, newMessage) => {
  void (async () => {
    if (!replies.has(newMessage.id)) return;
    if (fixMessage(newMessage.content).length === 0) await dropReply(newMessage.id);
  })().catch(() => {
    // if anything goes sideways here the delete handler still covers removal
  });
});

// Deleted your message? Take our reply with it.
client.on('messageDelete', (message) => {
  void dropReply(message.id).catch(() => {
    /* nothing to do */
  });
});

client.once('clientReady', () => {
  console.log(`logged in as ${client.user?.tag ?? 'unknown'}`);
});

await client.login(env.DISCORD_TOKEN);
