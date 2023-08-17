import { Client, GatewayIntentBits } from 'discord.js';
import { Command } from '../commands';

export class ClientService extends Client {
  public commands: Command[];

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });
  }
}
