import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '..';
import { Logger, reply, replyWithEmbed, UserReport } from '../../utils';
import { guildService, moderationService } from '../../services';
import { Channels, moderator, Roles } from '../../constants';

export default class ModReportCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'modreport';
  public description = 'Reports User';
  public dmPermission = false;
  public defaultMemberPermissions = moderator;
  public channels = [Channels.Staff.ModCommands];
  public options = [
    {
      name: 'tag',
      description: 'Discord user tag',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
    {
      name: 'warn',
      description: 'Do you want to issue a warning?',
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    } as APIApplicationCommandOption,
    {
      name: 'description',
      description: 'Reason for report',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
    {
      name: 'screenshot',
      description: 'Screenshot of offense',
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    } as APIApplicationCommandOption,
  ];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getString('tag');
    const issueWarn = interaction.options.getBoolean('warn');
    const description = interaction.options.getString('description');
    const attachment = interaction.options.getAttachment('screenshot', false);

    const member = (await guildService.get().members.fetch()).find(
      member => member.displayName === user
    );

    if (!member) {
      await reply(interaction, 'Member not found');
      return;
    }

    if (member.user.bot) {
      await reply(interaction, 'You cannot report a bot');
      return;
    }

    if (
      member.roles.cache.find(role => role.name === Roles.Moderator || role.name === Roles.Admin)
    ) {
      await reply(interaction, 'You cannot report a moderator');
      return;
    }

    try {
      const newReport = new UserReport(
        guildService.get(),
        member.id,
        description,
        attachment ? attachment.url : undefined
      );

      if (!newReport) {
        await reply(interaction, 'Error creating report');
      }

      if (issueWarn) {
        await replyWithEmbed(interaction, await moderationService.fileWarning(newReport));
      } else {
        await replyWithEmbed(interaction, await moderationService.fileReport(newReport));
      }
    } catch (error) {
      Logger.error('Failed to execute modreport command', error);
    }
  }
}
