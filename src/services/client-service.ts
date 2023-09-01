import { Client, GatewayIntentBits } from 'discord.js';
import { Command } from '../commands';
import { env, Logger } from '../utils';

export class ClientService extends Client {
  constructor(public commands: Command[]) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });
    this.login(env.CLIENT_TOKEN)
      .then(() => Logger.info('Client has logged in'))
      .catch(error => Logger.error('Client login error', error));
  }
}
