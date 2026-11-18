import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Showing } from '../../showings/entities/showing.entity';

@Entity('films')
export class Film {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  @Column({ type: 'varchar' })
  title: string;

  @ApiProperty({ example: 166 })
  @Column({ name: 'duration_minutes', type: 'integer' })
  durationMinutes: number;

  @ApiProperty({ example: 2024 })
  @Column({ name: 'release_year', type: 'integer' })
  releaseYear: number;

  @OneToMany(() => Showing, (showing) => showing.film)
  showings: Showing[];
}
