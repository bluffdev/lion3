import {
  ApplicationCommandPermissionType,
  CommandInteraction,
  Events,
  Interaction,
} from 'discord.js';
import { connectToDatabase, env, Logger } from './utils';
import { CommandHandler } from './events/command-handler';
import { ClientService } from './services/client-service';
import { CommandService } from './services/command-service';
import { GuildService } from './services/guild-service';
import { ClassService } from './services/class-service';

export class Bot {
  constructor(
    private clientService: ClientService,
    private commandService: CommandService,
    private guildService: GuildService,
    private classService: ClassService,
    private commandHandler: CommandHandler
  ) {
    connectToDatabase(env.MONGO_URL);
  }

  public async start(): Promise<void> {
    this.commandService.registerCommands();
    this.registerListeners();
  }

  private async registerListeners(): Promise<void> {
    this.clientService.on(Events.InteractionCreate, (intr: Interaction) =>
      this.onInteraction(intr)
    );
    this.clientService.once(Events.ClientReady, () => this.ready());
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
