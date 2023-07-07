import { Client, GatewayIntentBits } from 'discord.js';
import { Bot } from './bot';
import { CommandHandler } from './events';
import { PingCommand } from './commands/moderation';

(function start(): void {
  new Bot(
    new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
    }),
    new CommandHandler([PingCommand])
  );
})();
