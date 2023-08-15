import {
  AttachmentBuilder,
  CategoryChannel,
  EmbedBuilder,
  GuildChannel,
  PermissionsBitField,
  Snowflake,
  TextChannel,
} from 'discord.js';
import { Logger, Maybe, UserReport } from '../utils';
import { clientService, guildService } from './';
import { roles } from '../constants';

interface IReportPayload {
  embed: EmbedBuilder;
  attachment?: string;
}

export class WarningService {
  private _warnCategory: Maybe<CategoryChannel>;
  private _chanMap = new Map<Snowflake, GuildChannel>();

  public ACKNOWLEDGE_EMOJI = '👍';

  public async sendModMessageToUser(message: string, rep: UserReport): Promise<void> {
    const user = clientService.users.cache.get(rep.user);

    try {
      if (rep.attachment) {
        await user.send({
          content: `${message} Reason: ${rep.description}`,
          files: [new AttachmentBuilder(rep.attachment)],
        });
      } else {
        await user.send({
          content: `${message} Reason: ${rep.description}`,
        });
      }
    } catch (error) {
      Logger.error('error sending user modmessage', error);
    }
  }

  private async createChannelForWarn(message: string, rep: UserReport): Promise<void> {
    if (!this._warnCategory) {
      this._warnCategory = guildService.getChannel('warnings') as CategoryChannel;
    }

    const member = guildService.get().members.cache.get(rep.user);
    if (!member) {
      return;
    }

    const warnChan = await this.getChanForUser(rep, this._warnCategory);
    this._chanMap.set(rep.user, warnChan);

    await (warnChan as TextChannel).send(member.toString());

    const serialized = this.serializeToEmbed(message, rep);
    const embed = await (warnChan as TextChannel).send({
      embeds: [serialized.embed],
      files: [serialized.attachment],
    });
    await embed.react(this.ACKNOWLEDGE_EMOJI);

    // Give user Supsended Role until they acknowledge
    await member.roles.add(guildService.getRole('Suspended'));
  }

  private async getChanForUser(rep: UserReport, warnCat: CategoryChannel): Promise<GuildChannel> {
    if (this._chanMap.has(rep.user)) {
      return this._chanMap.get(rep.user);
    }

    return await guildService.get().channels.create({
      name: 'warning',
      parent: warnCat,
      permissionOverwrites: [
        {
          id: guildService.get().id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: guildService.getRole(roles.Moderator),
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: rep.user,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });
  }

  private serializeToEmbed(message: string, rep: UserReport): IReportPayload {
    const embed = new EmbedBuilder()
      .setTitle(message)
      .addFields({ name: 'Reason', value: rep.description ?? '<none>', inline: true })
      .setFooter({ text: 'React to acknowledge this warning' });

    return { embed, attachment: rep.attachment };
  }

  public async deleteChan(id: Snowflake): Promise<void> {
    await guildService.get().members.cache.get(id)?.roles.remove(guildService.getRole('Suspended'));

    let chan = this._chanMap.get(id);
    if (!chan) {
      // If the bot restated, it wont be in the map
      chan = guildService
        .get()
        .channels.cache.filter(c => c.name === id)
        .first() as GuildChannel;
    }

    await chan?.delete();
    this._chanMap.delete(id);
  }
}
