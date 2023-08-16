import { Guild, GuildMember, Snowflake } from 'discord.js';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { ModerationReportModel } from '../models';
// Convert any input (tag or id) into an id
export async function resolveToID(guild: Guild, tag: string): Promise<string | null> {
  try {
    const id = (await guild.members.fetch()).find(gm => gm.user.tag === tag)?.user.id;
    if (id) {
      return id;
    }

    // If the lookup didn't work, they may be banned
    // So check the banned list
    const bannedMembers = await guild.bans.fetch();
    const bannedMember = bannedMembers.filter(u => u.user.tag === tag).first();
    if (bannedMember) {
      return bannedMember.user.id;
    }

    // Check to see if a snowflake was passed in
    if (parseInt(tag)) {
      return tag;
    }

    return null;
  } catch (_) {
    return null;
  }
}

// Takes in an id or tag and finds the member
export async function resolveUser(guild: Guild, tag: string): Promise<GuildMember | null> {
  // Convert to ID to use for finding the GuildMember
  const id = await resolveToID(guild, tag);
  if (!id) {
    return null;
  }

  return guild.members.cache.get(id);
}

export function validateUser(tag: string): boolean {
  const regex = /^(([^#]+#\d{4})|\d{17,18})$/;
  return regex.test(tag);
}

export function isID(id: string): boolean {
  const regex = /\d{17,18}/;
  return regex.test(id);
}

export function serialiseReportForMessage(report: UserReport): string {
  const attachments = report.attachment || 'no attachment';
  return `\`${report.description ?? 'no description'}\`: [${attachments}] at ${new Date(
    report.timeStr
  ).toLocaleString('en-US')}`;
}

export async function insertReport(report: UserReport): Promise<ObjectId> {
  const rep = await ModerationReportModel.create(report);
  return rep.id;
}

export interface IReportSummary {
  reports: ModerationReportDocument[];
  warnings: ModerationWarningDocument[];
  banStatus: string | false;
}

export interface IModerationReport {
  guild: Snowflake;
  user: Snowflake;
  description: string;
  attachment?: string;
  timeStr: string;
  _id?: ObjectId;
}

export type ModerationReportDocument = IModerationReport & Document;

export interface IModerationBan {
  user: Snowflake;
  guild: Snowflake;
  date: Date;
  active: boolean;
  reason: string;
  reportId?: ObjectId;
  _id: ObjectId;
}

export type ModerationBanDocument = IModerationBan & Document;

export interface IModerationWarning {
  user: Snowflake;
  guild: Snowflake;
  date: Date;
  reportId?: ObjectId;
  _id: ObjectId;
}

export interface IModReportRequest {
  subCommand: string;
  givenHandle: string;
  description: string;
}

export type ModerationWarningDocument = IModerationWarning & Document;

export class UserReport implements IModerationReport {
  public guild: Snowflake;
  public user: Snowflake;
  public description: string;
  public attachment?: string;
  public timeStr: string;

  constructor(guild: Guild, id: string, description: string, attachment?: string) {
    this.guild = guild.id;
    this.user = id;
    this.description = description;
    this.attachment = attachment;
    this.timeStr = new Date().toISOString();
  }

  public toString(): string {
    return serialiseReportForMessage(this);
  }
}
