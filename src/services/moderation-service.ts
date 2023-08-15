import {
  EmbedBuilder,
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  TextChannel,
  User,
} from 'discord.js';
import { clientService, guildService, warningService } from '.';
import {
  insertReport,
  IReportSummary,
  Logger,
  Maybe,
  ModerationReportDocument,
  ModerationWarningDocument,
  resolveToID,
  resolveUser,
  serialiseReportForMessage,
  UserReport,
} from '../utils';
import { channels, roles } from '../constants';
import { ObjectId } from 'mongodb';
import { ModerationReportModel, ModerationWarningModel } from '../models';

export class ModerationService {
  private readonly QUICK_WARNS_THRESH = 3;
  private readonly QUICK_WARNS_TIMEFRAME = 14;
  private readonly KICK_THRESH = 3;
  private readonly SUSPEND_THRESH = 4;
  private readonly BAN_THRESH = 5;

  public async fileAnonReportWithTicketId(ticket_id: string, message: Message): Promise<string> {
    // overwrite with our user to protect reporter
    message.author = clientService.user as User;

    Logger.info(`Filing report with ticket_id ${ticket_id}`);

    const userOffenseChan = guildService
      .get()
      .channels.cache.find(c => c.name === channels.staff.modCommands);

    if (!userOffenseChan) {
      Logger.error(`Could not file report for ${message}`);
      return undefined;
    }

    await (userOffenseChan as TextChannel)
      .send({
        content: `:rotating_light::rotating_light: ANON REPORT Ticket ${ticket_id} :rotating_light::rotating_light:\n ${message.content}`,
        files: message.attachments.map(a => a.url),
      })
      .catch(error => Logger.error('Error while filing anonreport', error));

    return ticket_id;
  }

  public fileAnonReport(message: Message): Promise<Maybe<string>> {
    return this.fileAnonReportWithTicketId(this.generateTicketId(message), message);
  }

  public async respondToAnonReport(ticket_id: string, message: Message): Promise<Maybe<string>> {
    const decoded = this._tryDecodeTicketId(ticket_id);

    if (!decoded) {
      return undefined;
    }

    const [, user_id] = decoded;
    const user = guildService.get().members.cache.get(user_id);

    if (!user) {
      Logger.error(`respondToAnonReport: Could not resolve ${user_id} to a Guild member.`);
      return undefined;
    }

    await user
      .send({
        content: `Response to your anonymous report ticket ${ticket_id}:\n ${message.content}`,
        files: message.attachments.map(a => a.url),
      })
      .catch(error => Logger.error('Failed to send anonreport response', error));

    return ticket_id;
  }

  public generateTicketId(message: Message): string {
    return `${message.id}x${message.author?.id}`;
  }

  public isTicketId(maybe_ticket_id: string): boolean {
    return !!this._tryDecodeTicketId(maybe_ticket_id);
  }

  private _tryDecodeTicketId(ticket_id: string): Maybe<string[]> {
    const _REPORT_ID = /([^x]+)x([0-9]+)/;
    const match_report_id = ticket_id.match(_REPORT_ID);

    if (!match_report_id) {
      return undefined;
    }

    const [, message_id, user_id] = match_report_id;

    return [message_id, user_id];
  }

  // Files a report but does not warn subject
  public async fileReport(report: UserReport): Promise<string> {
    const res = await insertReport(report);
    if (res) {
      return `Added report: ${serialiseReportForMessage(report)}`;
    } else {
      return 'Could not insert report.';
    }
  }

  // Files a report and warns the subject.
  public async fileWarning(report: UserReport): Promise<string> {
    const member = await guildService
      .get()
      .members.fetch() // Cache all the members
      .then(fetched => fetched.get(report.user));

    if (!member) {
      return 'Member not found';
    }

    if (member?.user.bot) {
      return 'You cannot warn a bot.';
    }

    const fileReportResult: Maybe<ObjectId> = await insertReport(report);
    await ModerationWarningModel.create({
      user: report.user,
      guild: report.guild,
      date: new Date(),
      reportId: fileReportResult,
    });

    await warningService.sendModMessageToUser('A warning has been issued. ', report);

    const warnings =
      (await ModerationWarningModel.find({ user: report.user, guild: report.guild }).sort({
        date: -1,
      })) ?? [];

    const tempBanResult = await this._checkQuickWarns(warnings, report, fileReportResult);
    if (tempBanResult) {
      return tempBanResult;
    }

    const actionResult = await this._checkNumberOfWarns(warnings, report, fileReportResult);
    return `User warned: ${serialiseReportForMessage(report)}\n${actionResult}`;
  }

  private async _checkNumberOfWarns(
    warnings: ModerationWarningDocument[],
    report: UserReport,
    fileReportResult: Maybe<ObjectId>
  ): Promise<string> {
    const member = guildService.get().members.cache.get(report.user);
    if (!member) {
      return 'Could not find user';
    }

    const numWarns = warnings.length;

    // If below the minimum for punishment, return
    if (numWarns < this.KICK_THRESH) {
      return 'No further action was taken.';
    }

    if (numWarns >= this.KICK_THRESH && numWarns < this.SUSPEND_THRESH) {
      return await this._kickUser(member);
    }

    // Suspend user
    if (numWarns >= this.SUSPEND_THRESH && numWarns < this.BAN_THRESH) {
      return await this._suspendMember(member);
    }

    return (
      'User has been warned too many times. Escalating to permanent ban.\n' +
      `Result: ${await this._fileBan(report, fileReportResult, true)}`
    );
  }

  private async _checkQuickWarns(
    warns: ModerationWarningDocument[],
    report: UserReport,
    fileReportResult: Maybe<ObjectId>
  ): Promise<string | false> {
    const recentWarnings = warns.slice(0, this.QUICK_WARNS_THRESH);
    const beginningOfWarningRange = new Date();
    const warningRange = this.QUICK_WARNS_TIMEFRAME;
    beginningOfWarningRange.setDate(beginningOfWarningRange.getDate() - warningRange);

    const shouldTempBan =
      recentWarnings.length >= this.QUICK_WARNS_THRESH &&
      recentWarnings.reduce((acc, x) => acc && x.date >= beginningOfWarningRange, true);

    if (shouldTempBan) {
      return (
        `User has been warned too many times within ${this.QUICK_WARNS_TIMEFRAME} days. Escalating to temp ban.\n` +
        `Result: ${await this._fileBan(report, fileReportResult, false)}`
      );
    }

    return false;
  }

  public async fileBan(report: UserReport, isPermanent: boolean): Promise<string> {
    const res = await insertReport(report);
    return await this._fileBan(report, res, isPermanent);
  }

  // Files a report and bans the subject.
  private async _fileBan(
    report: UserReport,
    reportResult: Maybe<ObjectId>,
    isPermanent: boolean
  ): Promise<string> {
    // if (await this.isUserCurrentlyBanned(report.guild, report.user)) {
    //   return 'User is already banned.';
    // }
    try {
      await guildService
        .get()
        .members.cache.get(report.user)
        ?.send(
          `You have been banned ${isPermanent ? 'permanently' : 'for one week'} for ${
            report.description ?? report.attachments?.join(',')
          }`
        );
    } catch (error) {
      Logger.warn('Error telling user is banned', error);
    }

    try {
      await guildService.get().members.ban(report.user, { reason: report.description });
    } catch (e) {
      return `Issue occurred trying to ban user. ${e}`;
    }

    return 'Banned User';
  }

  private async _kickUser(member: GuildMember): Promise<string> {
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

  private async _suspendMember(member: GuildMember): Promise<string> {
    try {
      // Remove all roles from user
      await Promise.all(
        member.roles.cache.filter(r => r.name !== '@everyone').map(r => member.roles.remove(r))
      );

      const suspendedRole = guildService.getRole(roles.Suspended);
      await member.roles.add(suspendedRole);
      return `User has crossed threshold of ${this.SUSPEND_THRESH}, suspending user.\n`;
    } catch (e) {
      return `Error suspending user ${e}`;
    }
  }

  // Finds any associated IDs
  // Returns all Alt IDs and the one given

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

  // Produces a report summary.
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

  // Bans the user from reading/sending
  // in specified channels.
  // Files a report about it.
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

    await Promise.all(channelBanPromises);

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
