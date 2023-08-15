import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';

export const moderator = PermissionsBitField.resolve([
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.BanMembers,
]).toString();
