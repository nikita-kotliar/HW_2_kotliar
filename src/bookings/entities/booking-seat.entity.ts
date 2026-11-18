import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Showing } from '../../showings/entities/showing.entity';
import { Booking } from './booking.entity';

/**
 * Одне заброньоване місце. Унікальний індекс (showing_id, row, seat)
 * не дає продати те саме місце на тому самому сеансі двічі.
 * showing_id дублюється тут навмисно: індекс будується по колонках однієї таблиці.
 */
@Entity('booking_seats')
@Index('UQ_booking_seats_showing_row_seat', ['showingId', 'row', 'seat'], {
  unique: true,
})
export class BookingSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'showing_id', type: 'uuid' })
  showingId: string;

  @Column({ type: 'integer' })
  row: number;

  @Column({ type: 'integer' })
  seat: number;

  @ManyToOne(() => Booking, (booking) => booking.seats, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Showing, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'showing_id' })
  showing: Showing;
}
