import { REST } from 'discord.js';
import { env } from '../utils';
import { ClientService } from './client-service';
import { GuildService } from './guild-service';
import { ModerationService } from './moderation-service';
import { WarningService } from './warning-service';
import { ClassService } from './class-service';
import { CommandService } from './command-service';

export const clientService = new ClientService();
export const commandDeploymentService = new CommandService(
  new REST({ version: '10' }).setToken(env.CLIENT_TOKEN),
  clientService
);
export const guildService = new GuildService(clientService);
export const warningService = new WarningService(clientService);
export const moderationService = new ModerationService(guildService, warningService);
export const classService = new ClassService(guildService);
