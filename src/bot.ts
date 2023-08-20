import {
  ApplicationCommandPermissionType,
  ApplicationCommandType,
  CommandInteraction,
  Events,
  Interaction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import { connectToDatabase, env, Logger } from './utils';
import { CommandHandler } from './events/command-handler';
import { ClientService } from './services/client-service';
import { CommandDeploymentService } from './services/command-deployment-service';
import { GuildService } from './services/guild-service';
import { ClassService } from './services/class-service';

export class Bot {
  constructor(
    private clientService: ClientService,
    private commandDeploymentService: CommandDeploymentService,
    private guildService: GuildService,
    private classService: ClassService,
    private commandHandler: CommandHandler
  ) {
    connectToDatabase(env.MONGO_URL);
  }

  public async start(): Promise<void> {
    this.registerSlashCommands();
    this.registerListeners();
    this.login(env.CLIENT_TOKEN);
  }

  private async registerSlashCommands(): Promise<void> {
    const metadata: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    for (const cmd of this.clientService.commands) {
      const meta: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        type: cmd.type as ApplicationCommandType.ChatInput,
        name: cmd.name,
        description: cmd.description,
        dm_permission: cmd.dmPermission,
        default_member_permissions: cmd.defaultMemberPermissions,
        options: cmd.options,
      };
      metadata.push(meta);
    }

    try {
      await this.commandDeploymentService.registerAllCommands(metadata);
    } catch (error) {
      Logger.error('Failed to deploy commands', error);
    }
  }

  private async registerListeners(): Promise<void> {
    this.clientService.on(Events.InteractionCreate, (intr: Interaction) =>
      this.onInteraction(intr)
    );
    this.clientService.once(Events.ClientReady, () => this.ready());
  }

  private async login(token: string): Promise<void> {
    try {
      await this.clientService.login(token);
      Logger.info('Client has logged in');
    } catch (error) {
      Logger.error('Client login error', error);
      return;
    }
  }

  private async onInteraction(intr: Interaction): Promise<void> {
    if (intr instanceof CommandInteraction) {
      try {
        await this.commandHandler.process(intr);
      } catch (error) {
        Logger.error('Error with interaction create handler', error);
      }
    }
  }

  private async ready(): Promise<void> {
    this.guildService.setGuild();
    this.classService.addClasses();
    Logger.info('Client is ready');

    const commandData = this.clientService.application?.commands.cache;

    for (const cmd of this.clientService.commands) {
      if (cmd.channels) {
        const command = commandData?.find(cmd => cmd.name === cmd.name);

        if (command) {
          const permissions = cmd.channels.map(channelId => ({
            id: channelId,
            type: ApplicationCommandPermissionType.Channel,
            permission: true,
          }));

          this.clientService.guilds.cache
            .first()
            ?.commands.permissions.add({ token: env.ClIENT_ID, command: command.id, permissions });
        }
      }
    }
  }
}
