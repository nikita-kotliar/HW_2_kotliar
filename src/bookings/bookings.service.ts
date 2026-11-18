import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import { SeatPositionDto } from '../halls/dto/hall-with-seats.dto';
import { HallsService } from '../halls/halls.service';
import { ShowingsService } from '../showings/showings.service';
import {
  BookingResponseDto,
  SeatAvailabilityDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingSeat } from './entities/booking-seat.entity';
import { Booking } from './entities/booking.entity';

const seatKey = (s: SeatPositionDto) => `${s.row}:${s.seat}`;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(BookingSeat)
    private readonly bookingSeatsRepository: Repository<BookingSeat>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  async create(
    showingId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const showing = await this.showingsService.findOne(showingId);
    const { hall } = showing;

    const outside = dto.seats.filter(
      (s) => !this.hallsService.hasSeat(hall, s),
    );
    if (outside.length) {
      throw new BadRequestException(
        `Seats not in hall "${hall.name}" (${hall.rows}x${hall.seatsPerRow}): ` +
          outside.map(seatKey).join(', '),
      );
    }

    // Бронювання і всі його місця записуються в одній транзакції.
    // Зайняте місце порушує унікальний індекс (showing_id, row, seat):
    // транзакція відкочується, і в базі не лишається нічого.
    // try стоїть навколо transaction(), щоб TypeORM побачив виняток і зробив ROLLBACK.
    try {
      const booking = await this.dataSource.transaction(async (manager) => {
        const created = await manager.save(
          manager.create(Booking, {
            showingId: showing.id,
            totalPrice: showing.price * dto.seats.length,
          }),
        );
        created.seats = await manager.save(
          dto.seats.map(({ row, seat }) =>
            manager.create(BookingSeat, {
              bookingId: created.id,
              showingId: showing.id,
              row,
              seat,
            }),
          ),
        );
        return created;
      });
      return this.toResponse(booking);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'One or more of the requested seats are already booked for this showing',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingsRepository.find({
      relations: { seats: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return bookings.map((b) => this.toResponse(b));
  }

  async findByShowing(showingId: string): Promise<BookingResponseDto[]> {
    const showing = await this.showingsService.findOne(showingId);
    const bookings = await this.bookingsRepository.find({
      where: { showingId: showing.id },
      relations: { seats: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return bookings.map((b) => this.toResponse(b));
  }

  async getSeats(showingId: string): Promise<SeatAvailabilityDto[]> {
    const showing = await this.showingsService.findOne(showingId);
    const booked = await this.bookingSeatsRepository.find({
      where: { showingId: showing.id },
      select: { row: true, seat: true },
    });
    const bookedKeys = new Set(booked.map(seatKey));
    return this.hallsService
      .getSeats(showing.hall)
      .map((s) => ({ ...s, isBooked: bookedKeys.has(seatKey(s)) }));
  }

  /** Місця бронювання видаляє база: ON DELETE CASCADE на booking_seats.booking_id. */
  async remove(id: string): Promise<void> {
    const result = await this.bookingsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }
  }

  private toResponse(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      showingId: booking.showingId,
      seats: (booking.seats ?? [])
        .map(({ row, seat }) => ({ row, seat }))
        .sort((a, b) => a.row - b.row || a.seat - b.seat),
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt,
    };
  }
}
