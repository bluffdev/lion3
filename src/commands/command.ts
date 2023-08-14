import { CommandInteraction, PermissionsString } from 'discord.js';

export interface Command {
  name: string;
  channels?: string[];
  deferType: CommandDeferType;
  requireClientPerms: PermissionsString[];
  execute(interaction: CommandInteraction): Promise<void>;
}

export enum CommandDeferType {
  PUBLIC = 'PUBLIC',
  HIDDEN = 'HIDDEN',
  NONE = 'NONE',
}

export const Status = {
  SUCCESS: true,
  FAILURE: false,
};
