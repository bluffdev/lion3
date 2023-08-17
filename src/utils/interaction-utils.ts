import { CommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { Logger } from './';

export async function reply(
  intr: CommandInteraction,
  content: string,
  hidden: boolean = false
): Promise<Message | undefined> {
  try {
    return await intr.reply({
      content,
      ephemeral: hidden,
      fetchReply: true,
    });
  } catch (error) {
    Logger.error('Error sending reply', error);
  }
}

export async function replyWithEmbed(
  intr: CommandInteraction,
  embed: EmbedBuilder,
  hidden: boolean = false
): Promise<Message | undefined> {
  try {
    return await intr.reply({
      embeds: [embed],
      ephemeral: hidden,
      fetchReply: true,
    });
  } catch (error) {
    Logger.error('Error sending reply with embed', error);
  }
}
