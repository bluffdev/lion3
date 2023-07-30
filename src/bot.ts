import { CommandInteraction, Events, Interaction } from 'discord.js';
import { connectToDatabase, env, Logger } from './utils';
import { CommandMetadata } from './commands';
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
    clientService.once(Events.ClientReady, () => {
      Logger.info('Client is ready');
      guildService.setGuild();
    });
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
}
