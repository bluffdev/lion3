import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../command';
import { reply } from '../../utils';

export const PingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')
    .setDMPermission(false),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await reply(interaction, 'Pong!');
  },
};
