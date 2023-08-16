import { REST } from 'discord.js';
import { env } from '../utils';
import { CommandDeploymentService } from './command-deployment-service';
import { ClientService } from './client-service';
import { GuildService } from './guild-service';
import { ModerationService } from './moderation-service';
import { WarningService } from './warning-service';
import { ClassService } from './class-service';

export const commandDeploymentService = new CommandDeploymentService(
  new REST({ version: '10' }).setToken(env.CLIENT_TOKEN)
);

export const clientService = new ClientService();
export const guildService = new GuildService();
export const warningService = new WarningService();
export const moderationService = new ModerationService();
export const classService = new ClassService();
