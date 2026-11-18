import { ApiProperty } from '@nestjs/swagger';
import { SeatPositionDto } from '../../halls/dto/hall-with-seats.dto';

export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  showingId: string;

  @ApiProperty({ type: [SeatPositionDto] })
  seats: SeatPositionDto[];

  @ApiProperty({
    example: 25000,
    description: 'Ціна сеансу, помножена на кількість місць, у копійках',
  })
  totalPrice: number;

  @ApiProperty({ example: '2030-05-01T12:00:00.000Z' })
  createdAt: Date;
}

export class SeatAvailabilityDto extends SeatPositionDto {
  @ApiProperty({ example: false })
  isBooked: boolean;
}
