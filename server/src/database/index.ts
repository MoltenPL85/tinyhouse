import { createConnection } from 'typeorm';
import { Database } from '../lib/types';
import { ListingEntity, UserEntity, BookingEntity } from './entity';

export const connectDatabase = async (): Promise<Database> => {
  const connection = await createConnection({
    type: 'postgres',
    username: process.env.DB_USER_PG,
    password: process.env.DB_USER_PASSWORD_PG,
    database: 'tinyhouse',
    synchronize: true,
    logging: false,
    entities: ['src/database/entity/**/*.ts'],
    migrations: ['src/database/migration/**/*.ts'],
    subscribers: ['src/database/subscriber/**/*.ts'],
  });

  return {
    bookings: connection.getRepository(BookingEntity),
    listings: connection.getRepository(ListingEntity),
    users: connection.getRepository(UserEntity),
  };
};
