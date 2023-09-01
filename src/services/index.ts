import { REST } from 'discord.js';
import { env } from '../utils';
import { ClientService } from './client-service';
import { GuildService } from './guild-service';
import { ClassService } from './class-service';
import { CommandService } from './command-service';

import RegisterCommand from '../commands/channels/register';
import UnRegisterCommand from '../commands/channels/unregister';

export const clientService = new ClientService([new RegisterCommand(), new UnRegisterCommand()]);
export const commandService = new CommandService(
  new REST({ version: '10' }).setToken(env.CLIENT_TOKEN),
  clientService
);
export const guildService = new GuildService(clientService);
export const classService = new ClassService(guildService);
