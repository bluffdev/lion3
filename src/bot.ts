import { Client, CommandInteraction, Events, Interaction, REST } from 'discord.js';
import { env, Logger } from './utils';
import { CommandDeploymentService } from './services';
import { CommandMetadata } from './commands';
import { CommandHandler } from './events/command-handler';

export class Bot {
  constructor(private client: Client, private commandHandler: CommandHandler) {
    this.registerSlashCommands();
    this.registerListeners();
    this.login(env.CLIENT_TOKEN);
  }

  private async registerSlashCommands(): Promise<void> {
    let commandDeploymentService = new CommandDeploymentService(
      new REST({ version: '10' }).setToken(env.CLIENT_TOKEN)
    );
    let localCmds = [...Object.values(CommandMetadata)];
    try {
      await commandDeploymentService.register(localCmds);
    } catch (error) {
      throw new Error(error);
    }
  }

  private registerListeners(): void {
    this.client.on(Events.InteractionCreate, (intr: Interaction) => this.onInteraction(intr));
    this.client.once(Events.ClientReady, () => Logger.info('Client is ready'));
  }

  private async login(token: string): Promise<void> {
    try {
      await this.client.login(token);
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
