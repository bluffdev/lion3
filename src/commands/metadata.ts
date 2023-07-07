import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

export const CommandMetadata: {
  [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
  PING: {
    name: 'ping',
    description: 'Replies with Pong!',
    dm_permission: false,
    default_member_permissions: undefined,
  },
};
