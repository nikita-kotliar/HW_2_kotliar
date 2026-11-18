import { ApiProperty } from '@nestjs/swagger';

export class SeatPositionDto {
  @ApiProperty({ example: 1 })
  row: number;

  @ApiProperty({ example: 5 })
  seat: number;
}

export class HallWithSeatsDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Зал 1' })
  name: string;

  @ApiProperty({ example: 3 })
  rows: number;

  @ApiProperty({ example: 5 })
  seatsPerRow: number;

  @ApiProperty({ type: [SeatPositionDto] })
  seats: SeatPositionDto[];
}
