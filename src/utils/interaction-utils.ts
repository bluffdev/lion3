import { CommandInteraction, Message } from 'discord.js';
import { Logger } from './';

export async function reply(
  intr: CommandInteraction,
  content: string,
  hidden: boolean = false
): Promise<Message> {
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
