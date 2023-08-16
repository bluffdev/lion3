import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import { moderator } from '../constants';

export const CommandMetadata: {
  [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
  PING: {
    name: 'ping',
    description: 'Replies with Pong!',
    dm_permission: false,
    default_member_permissions: undefined,
  },
  MOD_REPORT: {
    type: ApplicationCommandType.ChatInput,
    name: 'modreport',
    description: 'Reports User',
    dm_permission: false,
    default_member_permissions: moderator,
    options: [
      {
        name: 'tag',
        description: 'Discord user tag',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'warn',
        description: 'Do you want to issue a warning?',
        type: ApplicationCommandOptionType.Boolean,
        required: true,
      },
      {
        name: 'description',
        description: 'Reason for report',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'screenshot',
        description: 'Screenshot of offense',
        type: ApplicationCommandOptionType.Attachment,
        required: false,
      },
    ],
  },
  MOD_LIST: {
    type: ApplicationCommandType.ChatInput,
    name: 'modlist',
    description: 'Sends moderation reports for a user',
    dm_permission: false,
    default_member_permissions: moderator,
    options: [
      {
        name: 'tag',
        description: 'Discord user tag',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  ANONREPORT: {
    type: ApplicationCommandType.ChatInput,
    name: 'anonreport',
    description: 'Sends an anonymous report to server moderators',
    dm_permission: true,
    default_member_permissions: undefined,
    options: [
      {
        name: 'anonymous',
        description: 'Select true if you do not want lion to log your user id',
        type: ApplicationCommandOptionType.Boolean,
        required: true,
      },
      {
        name: 'description',
        description: 'Reason for report',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'screenshot',
        description: 'Screenshot of offense',
        type: ApplicationCommandOptionType.Attachment,
        required: false,
      },
    ],
  },
  REGISTER: {
    type: ApplicationCommandType.ChatInput,
    name: 'register',
    description: 'Register for a class',
    dm_permission: false,
    default_member_permissions: undefined,
    options: [
      {
        name: 'class',
        description: 'Enter class to register for',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  UNREGISTER: {
    type: ApplicationCommandType.ChatInput,
    name: 'unregister',
    description: 'Unregister from a class',
    dm_permission: false,
    default_member_permissions: undefined,
    options: [
      {
        name: 'class',
        description: 'Enter class to unregister from',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
};
