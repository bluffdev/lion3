import {
  ApplicationCommandPermissionType,
  CommandInteraction,
  Events,
  Interaction,
} from 'discord.js';
import { connectToDatabase, env, Logger } from './utils';
import { CommandMetadata, commands } from './commands';
import { CommandHandler } from './events/command-handler';
import { clientService, commandDeploymentService, guildService } from './services';

export class Bot {
  constructor(private commandHandler: CommandHandler) {
    connectToDatabase(env.MONGO_URL);
    this.registerSlashCommands();
    this.registerListeners();
    this.login(env.CLIENT_TOKEN);
  }

  private async registerSlashCommands(): Promise<void> {
    let localCmds = [...Object.values(CommandMetadata)];
    try {
      await commandDeploymentService.register(localCmds);
    } catch (error) {
      throw new Error(error);
    }
  }

  private registerListeners(): void {
    clientService.on(Events.InteractionCreate, (intr: Interaction) => this.onInteraction(intr));
    clientService.once(Events.ClientReady, () => this.ready());
  }

  private async login(token: string): Promise<void> {
    try {
      await clientService.login(token);
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
    guildService.setGuild();
    Logger.info('Client is ready');

    const commandData = clientService.application.commands.cache;

    for (const c of commands) {
      if (c.channels) {
        const command = commandData.find(cmd => cmd.name === c.name);

        if (command) {
          const permissions = c.channels.map(channelId => ({
            id: channelId,
            type: ApplicationCommandPermissionType.Channel,
            permission: true,
          }));

          await clientService.guilds.cache
            .first()
            .commands.permissions.add({ token: env.ClIENT_ID, command: command.id, permissions });
        }
      }
    }
  }
}
