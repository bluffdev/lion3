import mongoose, { Schema } from 'mongoose';
import { ModerationReportDocument, ModerationWarningDocument } from '../utils';

// Moderation Report

const moderationReportSchema = new Schema(
  {
    guild: String,
    user: String,
    description: { type: String, required: false },
    attachments: [{ type: String, required: false }],
    timeStr: String,
  },
  { collection: 'modreports' }
);

export const ModerationReportModel = mongoose.model<ModerationReportDocument>(
  'modreports',
  moderationReportSchema
);

// Moderation Warnings.

const moderationWarningSchema = new Schema(
  {
    user: String,
    guild: String,
    date: Date,
    reportId: { type: Schema.Types.ObjectId, required: false },
  },
  { collection: 'modwarnings' }
);

export const ModerationWarningModel = mongoose.model<ModerationWarningDocument>(
  'modwarnings',
  moderationWarningSchema
);
