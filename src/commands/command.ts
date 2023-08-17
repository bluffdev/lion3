import {
  APIApplicationCommandOption,
  ApplicationCommandType,
  CommandInteraction,
} from 'discord.js';

export interface Command {
  type?: ApplicationCommandType;
  name: string;
  description: string;
  dmPermission: boolean;
  defaultMemberPermissions?: string;
  channels?: string[];
  options?: APIApplicationCommandOption[];
  execute(interaction: CommandInteraction): Promise<void>;
}
