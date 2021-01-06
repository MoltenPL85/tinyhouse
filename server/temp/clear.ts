import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../src/database';

const clear = async () => {
  try {
    console.log('[clear] : running...');

    const db = await connectDatabase();

    await db.bookings.clear();
    await db.listings.clear();
    await db.users.clear();

    console.log('[clear] : success');
    process.exit();
  } catch (error) {
    throw new Error('Failed to clear database');
  }
};

clear();
