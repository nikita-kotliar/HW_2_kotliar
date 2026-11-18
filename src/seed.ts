import { Booking } from './bookings/entities/booking.entity';
import { BookingSeat } from './bookings/entities/booking-seat.entity';
import dataSource from './database/data-source';
import { Film } from './films/entities/film.entity';
import { Hall } from './halls/entities/hall.entity';
import { Showing } from './showings/entities/showing.entity';

/**
 * Заповнює базу тестовими даними. Запуск: npm run seed (після npm run migration:run).
 * Усі записи мають фіксовані id, тож повторний запуск оновлює ті самі рядки
 * замість створення дублікатів.
 */

const films: Partial<Film>[] = [
  {
    id: '11111111-1111-4111-8111-000000000001',
    title: 'Dune: Part Two',
    durationMinutes: 166,
    releaseYear: 2024,
  },
  {
    id: '11111111-1111-4111-8111-000000000002',
    title: 'Interstellar',
    durationMinutes: 169,
    releaseYear: 2014,
  },
];

const halls: Partial<Hall>[] = [
  {
    id: '22222222-2222-4222-8222-000000000001',
    name: 'Seed: Великий зал',
    rows: 8,
    seatsPerRow: 12,
  },
  {
    id: '22222222-2222-4222-8222-000000000002',
    name: 'Seed: Малий зал',
    rows: 3,
    seatsPerRow: 5,
  },
];

const showings: Partial<Showing>[] = [
  {
    id: '33333333-3333-4333-8333-000000000001',
    filmId: films[0].id,
    hallId: halls[0].id,
    startsAt: new Date('2030-05-01T18:30:00Z'),
    price: 15000,
  },
  {
    id: '33333333-3333-4333-8333-000000000002',
    filmId: films[0].id,
    hallId: halls[1].id,
    startsAt: new Date('2030-05-02T10:00:00Z'),
    price: 9000,
  },
  {
    id: '33333333-3333-4333-8333-000000000003',
    filmId: films[1].id,
    hallId: halls[0].id,
    startsAt: new Date('2030-05-03T20:00:00Z'),
    price: 14000,
  },
  {
    id: '33333333-3333-4333-8333-000000000004',
    filmId: films[1].id,
    hallId: halls[1].id,
    startsAt: new Date('2030-05-04T15:15:00Z'),
    price: 11000,
  },
];

const booking = {
  id: '44444444-4444-4444-8444-000000000001',
  showingId: showings[0].id!,
  seats: [
    { row: 5, seat: 6 },
    { row: 5, seat: 7 },
  ],
};

async function seed() {
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      await manager.upsert(Film, films, ['id']);
      await manager.upsert(Hall, halls, ['id']);
      await manager.upsert(Showing, showings, ['id']);

      const exists = await manager.existsBy(Booking, { id: booking.id });
      if (!exists) {
        const showing = showings.find((s) => s.id === booking.showingId)!;
        await manager.insert(Booking, {
          id: booking.id,
          showingId: booking.showingId,
          totalPrice: showing.price! * booking.seats.length,
        });
        await manager.insert(
          BookingSeat,
          booking.seats.map((s) => ({
            bookingId: booking.id,
            showingId: booking.showingId,
            ...s,
          })),
        );
      }
    });

    const counts = await Promise.all(
      [Film, Hall, Showing, Booking, BookingSeat].map((entity) =>
        dataSource.getRepository(entity).count(),
      ),
    );
    console.log(
      `Seed done. films=${counts[0]} halls=${counts[1]} showings=${counts[2]} ` +
        `bookings=${counts[3]} booking_seats=${counts[4]}`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
