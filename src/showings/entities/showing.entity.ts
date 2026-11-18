import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { Film } from '../../films/entities/film.entity';
import { Hall } from '../../halls/entities/hall.entity';

@Entity('showings')
export class Showing {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'film_id', type: 'uuid' })
  filmId: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'hall_id', type: 'uuid' })
  hallId: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  @Index()
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  @Column({ type: 'integer' })
  price: number;

  @ManyToOne(() => Film, (film) => film.showings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'film_id' })
  film: Film;

  @ManyToOne(() => Hall, (hall) => hall.showings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'hall_id' })
  hall: Hall;

  @OneToMany(() => Booking, (booking) => booking.showing)
  bookings: Booking[];
}
