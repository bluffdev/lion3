import { EmbedBuilder } from 'discord.js';
import { Logger, UserReport } from '../utils';
import { clientService } from './';

export class WarningService {
  public async sendModMessageToUser(message: string, rep: UserReport): Promise<void> {
    const user = clientService.users.cache.get(rep.user);

    if (!user) {
      Logger.error('Could not find warned user');
      return;
    }

    try {
      if (rep.attachment) {
        await user.send({
          embeds: [
            new EmbedBuilder()
              .addFields(
                { name: 'Message', value: message },
                { name: 'Reason', value: rep.description }
              )
              .setImage(rep.attachment),
          ],
        });
      } else {
        await user.send({
          embeds: [
            new EmbedBuilder().addFields(
              { name: 'Message', value: message },
              { name: 'Reason', value: rep.description }
            ),
          ],
        });
      }
    } catch (error) {
      Logger.error('error sending user modmessage', error);
    }
  }
}
