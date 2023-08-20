import { REST } from 'discord.js';
import { env } from '../utils';
import { ClientService } from './client-service';
import { GuildService } from './guild-service';
import { ModerationService } from './moderation-service';
import { WarningService } from './warning-service';
import { ClassService } from './class-service';
import { CommandService } from './command-service';

import RegisterCommand from '../commands/channels/register';
import UnRegisterCommand from '../commands/channels/unregister';
import AnonReportCommand from '../commands/moderation/anonreport';
import ModListCommand from '../commands/moderation/modlist';
import ModReportCommand from '../commands/moderation/modreport';
import PingCommand from '../commands/moderation/ping';

export const clientService = new ClientService([
  new RegisterCommand(),
  new UnRegisterCommand(),
  new AnonReportCommand(),
  new ModListCommand(),
  new ModReportCommand(),
  new PingCommand(),
]);
export const commandService = new CommandService(
  new REST({ version: '10' }).setToken(env.CLIENT_TOKEN),
  clientService
);
export const guildService = new GuildService(clientService);
export const warningService = new WarningService(clientService);
export const moderationService = new ModerationService(guildService, warningService);
export const classService = new ClassService(guildService);
