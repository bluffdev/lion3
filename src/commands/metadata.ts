import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionFlagsBits,
  PermissionsBitField,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

export const CommandMetadata: {
  [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
  PING: {
    name: 'ping',
    description: 'Replies with Pong!',
    dm_permission: false,
    default_member_permissions: undefined,
  },
  REPORT: {
    type: ApplicationCommandType.ChatInput,
    name: 'report',
    description: 'Reports User',
    dm_permission: false,
    default_member_permissions: PermissionsBitField.resolve([
      PermissionFlagsBits.Administrator,
    ]).toString(),
    options: [
      {
        name: 'tag',
        description: 'Discord user tag',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'description',
        description: 'Reason for report',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  WARN: {
    type: ApplicationCommandType.ChatInput,
    name: 'warn',
    description: 'Warns a user',
    dm_permission: false,
    default_member_permissions: PermissionsBitField.resolve([
      PermissionFlagsBits.Administrator,
    ]).toString(),
    options: [
      {
        name: 'tag',
        description: 'Discord user tag',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'description',
        description: 'Reason for report',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
};
