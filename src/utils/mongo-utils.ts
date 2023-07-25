import mongoose from 'mongoose';
import { Logger } from './logger';

export async function connectToDatabase(connString: string): Promise<void> {
  try {
    await mongoose.connect(connString);
    Logger.info('Connected to database');
  } catch (error) {
    Logger.error('Error connected to database', error);
  }
}
