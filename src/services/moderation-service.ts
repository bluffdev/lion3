import {
  Attachment,
  EmbedBuilder,
  Guild,
  GuildChannel,
  GuildMember,
  TextChannel,
  ThreadAutoArchiveDuration,
  User,
} from 'discord.js';
import { guildService, warningService } from '.';
import {
  insertReport,
  IReportSummary,
  Logger,
  ModerationReportDocument,
  ModerationWarningDocument,
  resolveToID,
  resolveUser,
  serialiseReportForMessage,
  UserReport,
} from '../utils';
import { Channels, Roles } from '../constants';
import { ModerationReportModel, ModerationWarningModel } from '../models';

export class ModerationService {
  private readonly KICK_THRESH = 3;
  private readonly SUSPEND_THRESH = 4;
  private readonly BAN_THRESH = 5;

  public async fileAnonReport(
    user: User,
    anonymous: boolean,
    message: string,
    screenshot?: Attachment
  ): Promise<EmbedBuilder> {
    const modCommandsChannel = guildService
      .get()
      .channels.cache.find(c => c.name === Channels.Staff.ModCommands) as TextChannel;

    const embed = new EmbedBuilder().setDescription(`**Description:** ${message}`);

    if (!anonymous) {
      embed.setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL() });
    }

    if (screenshot) {
      embed.setImage(screenshot.url);
    }

    try {
      const reportThread = await modCommandsChannel.threads.create({
        name: 'ANON REPORT',
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        reason: 'Created anon report thread',
      });

      await reportThread.send({ embeds: [embed] });

      return embed;
    } catch (error) {
      Logger.error('Error logging anonreport in mod_commands', error);
    }
  }

  public async fileReport(report: UserReport): Promise<EmbedBuilder> {
    await insertReport(report);

    const member = await guildService
      .get()
      .members.fetch()
      .then(member => member.get(report.user));

    const embed = new EmbedBuilder()
      .setDescription(
        `Member: ${member.displayName}\nAction: Report\nReason: ${report.description}\n`
      )
      .setTimestamp();

    if (report.attachment) {
      embed.setImage(report.attachment);
    }

    return embed;
  }

  public async fileWarning(report: UserReport): Promise<EmbedBuilder> {
    const member = await guildService
      .get()
      .members.fetch()
      .then(member => member.get(report.user));

    const fileReportResult = await insertReport(report);

    await ModerationWarningModel.create({
      user: report.user,
      guild: report.guild,
      attachment: report.attachment,
      date: new Date(),
      reportId: fileReportResult,
    });

    await warningService.sendModMessageToUser('A warning has been issued. ', report);

    const warnings =
      (await ModerationWarningModel.find({ user: report.user, guild: report.guild }).sort({
        date: -1,
      })) ?? [];

    const numOfWarns = warnings.length;
    let result: Promise<string> | string;

    if (numOfWarns < this.KICK_THRESH) {
      result = 'No further action was taken.';
    } else if (numOfWarns < this.SUSPEND_THRESH) {
      result = await this.kickMember(member);
    } else if (numOfWarns < this.BAN_THRESH) {
      result = await this.suspendMember(member);
    } else {
      result =
        'User has been warned too many times. Escalating to permanent ban.\n' +
        `Result: ${await this.fileBan(report, true)}`;
    }

    const embed = new EmbedBuilder()
      .setDescription(
        `Member: ${member.displayName}\nAction: Warn\nReason: ${report.description}\n Result: ${result}`
      )
      .setTimestamp();

    if (report.attachment) {
      embed.setImage(report.attachment);
    }

    return embed;
  }

  private async fileBan(report: UserReport, isPermanent: boolean): Promise<string> {
    try {
      await guildService
        .get()
        .members.cache.get(report.user)
        ?.send(
          `You have been banned ${isPermanent ? 'permanently' : 'for one week'} for ${
            report.description ?? report.attachment
          }`
        );
    } catch (error) {
      Logger.warn('Error telling user is banned', error);
    }

    try {
      await guildService.get().members.ban(report.user, { reason: report.description });
    } catch (error) {
      return `Issue occurred trying to ban user. ${error}`;
    }

    return 'Banned User';
  }

  private async kickMember(member: GuildMember): Promise<string> {
    await member.send(
      'You are being kicked for too many warnings\n' +
        `You currently have been warned ${this.KICK_THRESH} times.\n` +
        `After ${this.SUSPEND_THRESH} warnings, you will have restricted access to the server.\n` +
        `After ${this.BAN_THRESH} warnings, you will be banned permanently.`
    );

    try {
      await member.kick();
    } catch (error) {
      Logger.warn(`Tried to kick user ${member.user.username} but failed`, error);
      return `Error kicking user: ${error}`;
    }

    return 'Kicked user';
  }

  private async suspendMember(member: GuildMember): Promise<string> {
    try {
      await Promise.allSettled(
        member.roles.cache
          .filter(role => role.name !== '@everyone')
          .map(role => member.roles.remove(role))
      );

      const suspendedRole = guildService.getRole(Roles.Suspended);
      await member.roles.add(suspendedRole);
      return `User has crossed threshold of ${this.SUSPEND_THRESH}, suspending user.\n`;
    } catch (error) {
      return `Error suspending user ${error}`;
    }
  }

  private async getAllReportsForUser(guild: Guild, member: GuildMember): Promise<IReportSummary> {
    const reports: ModerationReportDocument[] = [
      ...(await ModerationReportModel.find({ guild: guild.id, user: member.id })),
    ];
    const warnings: ModerationWarningDocument[] = [
      ...(await ModerationWarningModel.find({ guild: guild.id, user: member.id })),
    ];
    const banStatus = false;

    return { reports, warnings, banStatus };
  }

  public async getModerationSummary(
    guild: Guild,
    member: GuildMember
  ): Promise<EmbedBuilder | string> {
    const { reports, warnings } = await this.getAllReportsForUser(guild, member);

    const mostRecentWarning = warnings.sort((a, b) => (a.date > b.date ? -1 : 1));

    let lastWarning = '<none>';
    if (mostRecentWarning.length) {
      const _id = mostRecentWarning[0].reportId;
      const rep = await ModerationReportModel.findOne({ _id });
      if (rep) {
        lastWarning = serialiseReportForMessage(rep);
      }
    }

    const user = await resolveUser(guild, member.id);
    if (!user) {
      return 'Could not get member';
    }

    return new EmbedBuilder()
      .setTitle('Moderation Summary on ' + user.displayName)
      .addFields(
        { name: 'Total Reports', value: reports.length.toString(), inline: true },
        { name: 'Total Warnings', value: warnings.length.toString(), inline: true },
        { name: 'Ban Status', value: warnings.length.toString(), inline: true },
        { name: 'Last warning', value: lastWarning }
      )
      .setTimestamp(new Date())
      .setColor('#ff3300');
  }

  public async channelBan(
    guild: Guild,
    username: string,
    channels: GuildChannel[]
  ): Promise<GuildChannel[]> {
    const id = await resolveToID(guild, username);
    const successfulBanChannelList: GuildChannel[] = [];

    if (!id) {
      Logger.error(`Failed to resolve ${username} to a user.`);
      return successfulBanChannelList;
    }

    const user = guild.members.cache.get(id)?.user;
    if (!user) {
      Logger.error(`Failed to resolve ${username} to a user.`);
      return successfulBanChannelList;
    }

    const channelBanPromises = channels.reduce((acc, channel) => {
      Logger.info(`Taking channel permissions away in ${channel.name}`);
      acc.push(
        channel.permissionOverwrites
          .create(id, {
            ViewChannel: false,
            SendMessages: false,
          })
          .then(() => successfulBanChannelList.push(channel))
          .catch(error => {
            Logger.error(`Failed to adjust permissions for ${username} in ${channel.name}`, error);
          })
      );
      return acc;
    }, [] as Promise<void | number>[]);

    await Promise.allSettled(channelBanPromises);

    try {
      await insertReport(
        new UserReport(
          guild,
          id,
          `Took channel permissions away in ${successfulBanChannelList.map(c => c.name).join(', ')}`
        )
      );
    } catch (error) {
      Logger.error('Failed to add report about channel ban.', error);
    }

    return successfulBanChannelList;
  }
}
