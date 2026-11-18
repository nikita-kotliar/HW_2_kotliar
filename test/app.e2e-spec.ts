import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

const missingId = '00000000-0000-4000-8000-000000000000';

describe('Cinema API with PostgreSQL (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    http = request(app.getHttpServer());
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE booking_seats, bookings, showings, halls, films CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function seed() {
    const film = await http
      .post('/films')
      .send({ title: 'Dune', durationMinutes: 166, releaseYear: 2024 })
      .expect(201);
    const hall = await http
      .post('/halls')
      .send({ name: 'Hall 1', rows: 3, seatsPerRow: 5 })
      .expect(201);
    const showing = await http
      .post('/showings')
      .send({
        filmId: film.body.id,
        hallId: hall.body.id,
        startsAt: '2030-05-01T18:30:00Z',
        price: 12500,
      })
      .expect(201);
    return {
      filmId: film.body.id as string,
      hallId: hall.body.id as string,
      showingId: showing.body.id as string,
    };
  }

  it('returns unified error structure', async () => {
    const res = await http.get(`/films/${missingId}`).expect(404);
    expect(res.body).toEqual({
      statusCode: 404,
      message: expect.stringContaining('not found'),
      error: 'Not Found',
      path: `/films/${missingId}`,
      timestamp: expect.any(String),
    });
    const bad = await http.post('/films').send({}).expect(400);
    expect(bad.body.statusCode).toBe(400);
    expect(Array.isArray(bad.body.message)).toBe(true);
    expect(bad.body.path).toBe('/films');
  });

  it('films CRUD', async () => {
    const { body } = await http
      .post('/films')
      .send({ title: 'A', durationMinutes: 90, releaseYear: 2020, extra: 1 })
      .expect(201);
    expect(body).toEqual({
      id: expect.any(String),
      title: 'A',
      durationMinutes: 90,
      releaseYear: 2020,
    });
    await http.get('/films').expect(200, [body]);
    await http
      .patch(`/films/${body.id}`)
      .send({ title: 'B' })
      .expect(200)
      .expect((r) => expect(r.body.title).toBe('B'));
    await http
      .patch(`/films/${body.id}`)
      .send({ releaseYear: 'x' })
      .expect(400);
    await http.delete(`/films/${body.id}`).expect(204, '');
    await http.get(`/films/${body.id}`).expect(404);
    await http.get('/films/not-a-uuid').expect(400);
  });

  it('halls: seats and unique name', async () => {
    const { body } = await http
      .post('/halls')
      .send({ name: 'Big', rows: 3, seatsPerRow: 5 })
      .expect(201);
    const hall = await http.get(`/halls/${body.id}`).expect(200);
    expect(hall.body.seats).toHaveLength(15);
    await http
      .post('/halls')
      .send({ name: 'Big', rows: 1, seatsPerRow: 1 })
      .expect(409);
    await http
      .post('/halls')
      .send({ name: 'big', rows: 1, seatsPerRow: 1 })
      .expect(409);
  });

  it('forbids deleting film and hall used by a showing', async () => {
    const { filmId, hallId } = await seed();
    const film = await http.delete(`/films/${filmId}`).expect(409);
    expect(film.body.message).toContain('showing');
    await http.delete(`/halls/${hallId}`).expect(409);
  });

  it('showings: validation', async () => {
    const { filmId, hallId } = await seed();
    const base = { filmId, hallId, startsAt: '2030-01-01T10:00:00Z', price: 1 };
    const r = await http
      .post('/showings')
      .send({ ...base, filmId: missingId })
      .expect(400);
    expect(r.body.message).toContain('Film');
    await http
      .post('/showings')
      .send({ ...base, hallId: missingId })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, filmId: 'x' })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, startsAt: 'nope' })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, startsAt: '2000-01-01T10:00:00Z' })
      .expect(400);
    await http
      .post('/showings')
      .send({ ...base, price: 1.5 })
      .expect(400);
  });

  it('showings: pagination, filters and sorting', async () => {
    const { filmId, hallId } = await seed(); // 2030-05-01T18:30
    const other = await http
      .post('/films')
      .send({ title: 'Other', durationMinutes: 100, releaseYear: 2021 })
      .expect(201);
    const create = (fId: string, startsAt: string) =>
      http
        .post('/showings')
        .send({ filmId: fId, hallId, startsAt, price: 100 })
        .expect(201);
    await create(filmId, '2030-05-01T09:00:00Z');
    await create(filmId, '2030-05-02T09:00:00Z');
    await create(other.body.id, '2030-05-01T12:00:00Z');
    await create(other.body.id, '2030-05-01T12:00:00Z');

    const all = await http.get('/showings').expect(200);
    expect(all.body).toMatchObject({ total: 5, page: 1, limit: 20 });
    const times = all.body.items.map((s: { startsAt: string }) => s.startsAt);
    expect(times).toEqual([...times].sort());
    const tied = all.body.items.filter(
      (s: { startsAt: string }) => s.startsAt === '2030-05-01T12:00:00.000Z',
    );
    expect(tied[0].id < tied[1].id).toBe(true);

    const desc = await http.get('/showings?sort=desc&limit=2').expect(200);
    expect(desc.body.total).toBe(5);
    expect(desc.body.items).toHaveLength(2);
    expect(desc.body.items[0].startsAt).toBe('2030-05-02T09:00:00.000Z');

    const page2 = await http.get('/showings?limit=2&page=2').expect(200);
    expect(page2.body.items.map((s: { id: string }) => s.id)).toEqual(
      all.body.items.slice(2, 4).map((s: { id: string }) => s.id),
    );

    const filtered = await http
      .get(`/showings?filmId=${filmId}&date=2030-05-01`)
      .expect(200);
    expect(filtered.body.total).toBe(2);
    expect(filtered.body.items[0]).toMatchObject({
      filmTitle: 'Dune',
      hallName: 'Hall 1',
      startsAt: '2030-05-01T09:00:00.000Z',
    });

    for (const q of [
      'page=0',
      'page=1.5',
      'limit=0',
      'limit=101',
      'limit=abc',
      'sort=up',
      'date=2030-5-1',
      'filmId=123',
    ]) {
      await http.get(`/showings?${q}`).expect(400);
    }
  });

  it('bookings: transaction, conflict and cancel', async () => {
    const { showingId } = await seed();
    const url = `/showings/${showingId}/bookings`;

    const booking = await http
      .post(url)
      .send({
        seats: [
          { row: 1, seat: 3 },
          { row: 1, seat: 4 },
        ],
      })
      .expect(201);
    expect(booking.body).toMatchObject({
      showingId,
      totalPrice: 25000,
      seats: [
        { row: 1, seat: 3 },
        { row: 1, seat: 4 },
      ],
    });

    await http.post(url).send({ seats: [] }).expect(400);
    await http
      .post(url)
      .send({
        seats: [
          { row: 2, seat: 2 },
          { row: 2, seat: 2 },
        ],
      })
      .expect(400);
    await http
      .post(url)
      .send({ seats: [{ row: 4, seat: 1 }] })
      .expect(400);
    await http
      .post(`/showings/${missingId}/bookings`)
      .send({ seats: [{ row: 1, seat: 1 }] })
      .expect(404);

    const conflict = await http
      .post(url)
      .send({
        seats: [
          { row: 2, seat: 1 },
          { row: 1, seat: 4 },
        ],
      })
      .expect(409);
    expect(JSON.stringify(conflict.body)).not.toMatch(
      /duplicate|constraint|23505/i,
    );

    // Нічого не записано частково: 2:1 вільне, бронювань одне.
    const [{ count }] = await dataSource.query<{ count: string }[]>(
      'SELECT count(*) FROM booking_seats',
    );
    expect(count).toBe('2');
    await http.get('/bookings').expect((r) => expect(r.body).toHaveLength(1));

    const seats = await http.get(`/showings/${showingId}/seats`).expect(200);
    expect(seats.body).toHaveLength(15);
    expect(
      seats.body
        .filter((s: { isBooked: boolean }) => s.isBooked)
        .map((s: { row: number; seat: number }) => `${s.row}:${s.seat}`),
    ).toEqual(['1:3', '1:4']);

    await http.get(url).expect((r) => expect(r.body).toHaveLength(1));
    await http.delete(`/bookings/${booking.body.id}`).expect(204);
    await http.delete(`/bookings/${booking.body.id}`).expect(404);

    const [{ count: after }] = await dataSource.query<{ count: string }[]>(
      'SELECT count(*) FROM booking_seats',
    );
    expect(after).toBe('0');
    await http
      .post(url)
      .send({
        seats: [
          { row: 1, seat: 3 },
          { row: 1, seat: 4 },
        ],
      })
      .expect(201);
  });

  it('concurrent bookings of the same seat: exactly one succeeds', async () => {
    const { showingId } = await seed();
    const url = `/showings/${showingId}/bookings`;
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post(url)
          .send({ seats: [{ row: 3, seat: 3 }] }),
      ),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
  });
});
