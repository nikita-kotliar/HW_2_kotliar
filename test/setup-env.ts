// e2e-тести працюють з окремою базою, щоб не чіпати дані розробки.
// Змінні з process.env мають пріоритет над .env у ConfigModule.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'cinema_test';
