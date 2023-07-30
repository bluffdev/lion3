import { CommandInteraction, PermissionsString } from 'discord.js';

export interface Command {
  name: string;
  deferType: CommandDeferType;
  requireClientPerms: PermissionsString[];
  execute(interaction: CommandInteraction): Promise<void>;
}

export enum CommandDeferType {
  PUBLIC = 'PUBLIC',
  HIDDEN = 'HIDDEN',
  NONE = 'NONE',
}

export enum ReportOption {
  ADD = 'add',
  WARN = 'warn',
  LIST = 'list',
  FULL = 'full',
}
