import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env.validation';
import { buildTypeOrmOptions } from './typeorm.options';

// Джерело даних для CLI TypeORM (міграції) і для src/seed.ts.
// Застосунок читає ті самі змінні через ConfigModule.
try {
  process.loadEnvFile();
} catch {
  // .env може бути відсутній, якщо змінні задані в оточенні
}

const env = validateEnv(process.env);

export default new DataSource(buildTypeOrmOptions(env));
