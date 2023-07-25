import mongoose, { Schema } from 'mongoose';

export type AltTrackerEntry = {
  guildID: string;
  baseID: string;
  knownIDs: string[];
};

export type AltTrackerDocument = AltTrackerEntry & Document;

const altTrackerSchema = new Schema(
  {
    guildID: String,
    baseID: String,
    knownIDs: [{ type: String }],
  },
  { collection: 'altTracker' }
);

export const AltTrackerModel = mongoose.model<AltTrackerDocument>('altTracker', altTrackerSchema);
