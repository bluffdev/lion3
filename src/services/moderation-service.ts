import {
  EmbedBuilder,
  Guild,
  GuildChannel,
  GuildMember,
  Message,
  Snowflake,
  TextChannel,
  User,
} from 'discord.js';
import { clientService, guildService, warningService } from '.';
import {
  IModerationReport,
  IModerationWarning,
  IReportSummary,
  Logger,
  Maybe,
  ModerationReportDocument,
  ModerationWarningDocument,
  Report,
  resolveToID,
  resolveUser,
  serialiseReportForMessage,
} from '../utils';
import { channels, roles } from '../constants';
import { ObjectId } from 'mongodb';
import {
  AltTrackerModel,
  ModerationBanModel,
  ModerationReportModel,
  ModerationWarningModel,
} from '../models';
import { promises, readFileSync } from 'fs';
import mongoose from 'mongoose';

export class ModerationService {
  private _QUICK_WARNS_THRESH = 3;
  private _QUICK_WARNS_TIMEFRAME = 14;

  private _KICK_THRESH = 3;
  private _SUSPEND_THRESH = 4;
  private _BAN_THRESH = 5;

  // Files a report but does not warn the subject.
  public async fileReport(report: Report): Promise<string> {
    const res = await this._insertReport(report);
    if (res) {
      return `Added report: ${serialiseReportForMessage(report)}`;
    } else {
      return 'Could not insert report.';
    }
  }

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

  // Files a report and warns the subject.
  public async fileWarning(report: Report): Promise<string> {
    const member = await guildService
      .get()
      .members.fetch() // Cache all the members
      .then(fetched => fetched.get(report.user));

    if (member?.user.bot) {
      return 'You cannot warn a bot.';
    }

    const fileReportResult: Maybe<ObjectId> = await this._insertReport(report);
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
    report: Report,
    fileReportResult: Maybe<ObjectId>
  ): Promise<string> {
    const member = guildService.get().members.cache.get(report.user);
    if (!member) {
      return 'Could not find user';
    }

    const numWarns = warnings.length;

    // If below the minimum for punishment, return
    if (numWarns < this._KICK_THRESH) {
      return 'No further action was taken.';
    }

    if (numWarns >= this._KICK_THRESH && numWarns < this._SUSPEND_THRESH) {
      return await this._kickUser(member);
    }

    // Suspend user
    if (numWarns >= this._SUSPEND_THRESH && numWarns < this._BAN_THRESH) {
      return await this._suspendMember(member);
    }

    return (
      'User has been warned too many times. Escalating to permanent ban.\n' +
      `Result: ${await this._fileBan(report, fileReportResult, true)}`
    );
  }

  private async _checkQuickWarns(
    warns: ModerationWarningDocument[],
    report: Report,
    fileReportResult: Maybe<ObjectId>
  ): Promise<string | false> {
    const recentWarnings = warns.slice(0, this._QUICK_WARNS_THRESH);
    const beginningOfWarningRange = new Date();
    const warningRange = this._QUICK_WARNS_TIMEFRAME;
    beginningOfWarningRange.setDate(beginningOfWarningRange.getDate() - warningRange);

    const shouldTempBan =
      recentWarnings.length >= this._QUICK_WARNS_THRESH &&
      recentWarnings.reduce((acc, x) => acc && x.date >= beginningOfWarningRange, true);

    if (shouldTempBan) {
      return (
        `User has been warned too many times within ${this._QUICK_WARNS_TIMEFRAME} days. Escalating to temp ban.\n` +
        `Result: ${await this._fileBan(report, fileReportResult, false)}`
      );
    }

    return false;
  }

  public async fileBan(report: Report, isPermanent: boolean): Promise<string> {
    const res = await this._insertReport(report);
    return await this._fileBan(report, res, isPermanent);
  }

  // Files a report and bans the subject.
  private async _fileBan(
    report: Report,
    reportResult: Maybe<ObjectId>,
    isPermanent: boolean
  ): Promise<string> {
    if (await this.isUserCurrentlyBanned(report.guild, report.user)) {
      return 'User is already banned.';
    }

    await ModerationBanModel.create({
      guild: report.guild,
      user: report.user,
      date: new Date(),
      active: true,
      reason: report.description ?? '<none>',
      reportId: reportResult,
      permanent: isPermanent,
    });

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
        `You currently have been warned ${this._KICK_THRESH} times.\n` +
        `After ${this._SUSPEND_THRESH} warnings, you will have restricted access to the server.\n` +
        `After ${this._BAN_THRESH} warnings, you will be banned permanently.`
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
      return `User has crossed threshold of ${this._SUSPEND_THRESH}, suspending user.\n`;
    } catch (e) {
      return `Error suspending user ${e}`;
    }
  }

  // Finds any associated IDs
  // Returns all Alt IDs and the one given
  public async getAllKnownAltIDs(guild: Guild, givenID: string): Promise<string[]> {
    const altDoc = (await AltTrackerModel.find({})).find(altDoc =>
      altDoc.knownIDs.includes(givenID)
    );

    if (altDoc) {
      return altDoc.knownIDs;
    }

    return [givenID];
  }

  private async _getAllReportsWithAlts(guild: Guild, givenID: string): Promise<IReportSummary> {
    const reports: ModerationReportDocument[] = [];
    const warnings: ModerationWarningDocument[] = [];
    let banStatus: string | false = false; // False, else gives details of ban

    const allKnownIDs = await this.getAllKnownAltIDs(guild, givenID);

    // Add up all reports and warns from alts
    for (const id of allKnownIDs) {
      reports.push(...(await ModerationReportModel.find({ guild: guild.id, user: id })));
      warnings.push(...(await ModerationWarningModel.find({ guild: guild.id, user: id })));

      if (!banStatus) {
        const newBanStatus = await this._getBanStatus(guild, id);
        if (newBanStatus !== 'Not banned') {
          banStatus = newBanStatus;
        }
      }
    }
    return { reports, warnings, banStatus };
  }

  // Produces a report summary.
  public async getModerationSummary(guild: Guild, givenID: string): Promise<EmbedBuilder | string> {
    const { reports, warnings } = await this._getAllReportsWithAlts(guild, givenID);
    const mostRecentWarning = warnings.sort((a, b) => (a.date > b.date ? -1 : 1));

    let lastWarning = '<none>';
    if (mostRecentWarning.length) {
      const _id = mostRecentWarning[0].reportId;
      const rep = await ModerationReportModel.findOne({ _id });
      if (rep) {
        lastWarning = serialiseReportForMessage(rep);
      }
    }

    const user = await resolveUser(guild, givenID);
    if (!user) {
      return 'Could not get member';
    }

    return new EmbedBuilder()
      .setTitle('Moderation Summary on ' + user.displayName)
      .addFields(
        { name: 'Total Reports', value: reports.length.toString(), inline: true },
        { name: 'Total Warnings', value: warnings.length.toString(), inline: true },
        { name: 'Ban Status', value: warnings.length.toString(), inline: true },
        { name: 'Last warning', value: lastWarning },
        {
          name: 'Known IDs',
          value: (await this.getAllKnownAltIDs(guild, givenID)).join('\n'),
          inline: true,
        }
      )
      .setTimestamp(new Date())
      .setColor('#ff3300');
  }

  public async getFullReport(guild: Guild, givenID: string): Promise<string> {
    const { reports, warnings, banStatus } = await this._getAllReportsWithAlts(guild, givenID);

    // Number of Reports > warns
    // Each row has 2 cells, left cell is report, right cell is warn
    const rows: string[][] = new Array(reports.length);
    reports.forEach((report, i) => {
      rows[i] = new Array(2);
      rows[i][0] = this._serializeReportForTable(report);

      const reportID = report._id?.toHexString();
      if (!reportID || !warnings) {
        return;
      }

      const relatedWarn = warnings.filter(w => w.reportId?.toHexString() === reportID);
      if (!relatedWarn?.length) {
        return;
      }

      rows[i][1] = this._serializeWarningForTable(relatedWarn[0]);
    });

    // Create HTML table
    const table = this.createTableFromReports(rows);

    // Retrieve template

    const defaultHTML = readFileSync('./src/app/__generated__/reportTemplate.html', 'utf8');

    // Replace the placeholders with data we've collected
    const data = defaultHTML
      .replace('BAN_STATUS', banStatus || 'Not banned')
      .replace('DYNAMIC_TABLE', table)
      .replace('NUM_REPORTS', `${reports.length}`)
      .replace('NUM_WARNS', `${warnings.length}`)
      .replace('USER_NAME', `${givenID}`);
    return await this.writeDataToFile(data);
  }

  private async _getBanStatus(guild: Guild, id: string): Promise<string> {
    const mostRecentBan =
      (await ModerationBanModel.find({ guild: guild.id, user: id }).sort({ date: -1 }).limit(1)) ??
      [];

    if (mostRecentBan.length && mostRecentBan[0].active) {
      return `Banned since ${mostRecentBan[0].date.toLocaleString()}`;
    }
    return 'Not banned';
  }

  private createTableFromReports(rows: string[][]): string {
    // Wrap each cell in <td> tags
    // Wrap each row in <tr> tags
    return rows
      .map((row: string[]) => `<tr>${row.map(cell => `<td>${cell}</td>`).join('\n')}</tr>`)
      .join('\n');
  }

  private _serializeReportForTable(report: IModerationReport): string {
    const serializedReport = `Reported on: ${report.timeStr}<br />Description: ${
      report.description ?? 'No Description'
    }`;
    if (!report.attachments?.length) {
      return serializedReport;
    }

    return `${serializedReport}<br />Attachments: ${report.attachments.map(a => {
      // If its an image, embed it
      if (a.includes('.png') || a.includes('.jpg')) {
        return `<img src="${a}">`;
      }

      // Return as hyperlink to file
      return `<a href="${a}">Linked File</a>`;
    })}`;
  }

  private _serializeWarningForTable(warning: IModerationWarning): string {
    return `Warned on ${warning.date}`;
  }

  private async writeDataToFile(data: string): Promise<string> {
    const discrim = `${Math.random()}`;
    const filename = `/tmp/report${discrim}.html`;
    await promises.writeFile(filename, data).catch(error => {
      Logger.error(`While writing to ${filename}`, error);
    });
    return filename;
  }

  public async checkForScheduledUnBans(): Promise<void> {
    Logger.info('Running UnBan');

    if (!mongoose.connection.readyState) {
      Logger.info('No modbans DB. Skipping this run of checkForScheduledUnBans');
      return;
    }

    const guild = guildService.get();
    const bulk = ModerationBanModel.collection.initializeUnorderedBulkOp();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const toUnban = await ModerationBanModel.find({
        guild: guild.id,
        active: true,
        date: { $lte: new Date(sevenDaysAgo.toISOString()) },
      });

      const unbans = toUnban.map(async ban => {
        Logger.info(`Unbanning user ${ban.user}`);
        try {
          await guild.members.unban(ban.user);
        } catch (error) {
          Logger.error(`Failed to unban user ${ban.user}`, error);
        }
        bulk.find({ _id: ban._id }).updateOne({ $set: { active: false } });
      });

      await Promise.all(unbans);

      if (unbans.length === 0) {
        Logger.info('No UnBans to perform.');
        return;
      }

      await bulk.execute();
    } catch (error) {
      Logger.error(`check for scheduled bans ${error}`);
    }
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
      await this._insertReport(
        new Report(
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

  private async _insertReport(report: Report): Promise<Maybe<ObjectId>> {
    const rep = await ModerationReportModel.create(report);
    return rep?.id;
  }

  private async isUserCurrentlyBanned(guild: Snowflake, user: Snowflake): Promise<boolean> {
    const userBan = await ModerationBanModel.findOne({ guild, user, active: true });
    return userBan?.active;
  }
}
