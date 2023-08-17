import {
  ApplicationCommandPermissionType,
  ApplicationCommandType,
  CommandInteraction,
  Events,
  Interaction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import { connectToDatabase, env, Logger } from './utils';
import { Command } from './commands';
import { CommandHandler } from './events/command-handler';
import { classService, clientService, commandDeploymentService, guildService } from './services';
import path from 'path';
import fs from 'fs';

export class Bot {
  constructor(private commandHandler: CommandHandler) {
    connectToDatabase(env.MONGO_URL);
  }

  public async start(): Promise<void> {
    await this.registerSlashCommands();
    this.registerListeners();
    this.login(env.CLIENT_TOKEN);
  }

  private async registerSlashCommands(): Promise<void> {
    const metadata: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    for (const cmd of clientService.commands) {
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
      await commandDeploymentService.registerAllCommands(metadata);
    } catch (error) {
      throw new Error(error);
    }
  }

  public loadCommands(): void {
    const directories = ['/commands/channels', '/commands/moderation'];
    const commands: Command[] = [];

    for (const dir of directories) {
      const curr = path.join(__dirname, dir);
      try {
        const files = fs.readdirSync(curr);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const commandImport = require(path.join(curr, file));
            const { default: commandClass } = commandImport;
            const newCommand = new commandClass();

            commands.push(newCommand);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}`, error);
      }
    }

    clientService.commands = commands;
  }

  private async registerListeners(): Promise<void> {
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
    classService.addClasses();
    Logger.info('Client is ready');

    const commandData = clientService.application.commands.cache;

    for (const cmd of clientService.commands) {
      if (cmd.channels) {
        const command = commandData.find(cmd => cmd.name === cmd.name);

        if (command) {
          const permissions = cmd.channels.map(channelId => ({
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
