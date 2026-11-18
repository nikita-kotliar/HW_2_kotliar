import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingSeat } from '../bookings/entities/booking-seat.entity';
import { EnvironmentVariables } from '../config/env.validation';
import { Film } from '../films/entities/film.entity';
import { Hall } from '../halls/entities/hall.entity';
import { Showing } from '../showings/entities/showing.entity';

type DbEnv = Pick<
  EnvironmentVariables,
  'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME'
>;

/** Спільні параметри підключення для застосунку й для CLI TypeORM. */
export function buildTypeOrmOptions(env: DbEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    uuidExtension: 'pgcrypto',
    entities: [Film, Hall, Showing, Booking, BookingSeat],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
  };
}
