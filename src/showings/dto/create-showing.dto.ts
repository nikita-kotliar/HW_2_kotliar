import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsPositive, IsUUID } from 'class-validator';

export class CreateShowingDto {
  @ApiProperty({ format: 'uuid', description: 'Ідентифікатор фільму' })
  @IsUUID('all', { message: 'filmId must be a UUID' })
  filmId: string;

  @ApiProperty({ format: 'uuid', description: 'Ідентифікатор залу' })
  @IsUUID('all', { message: 'hallId must be a UUID' })
  hallId: string;

  @ApiProperty({
    example: '2030-05-01T18:30:00Z',
    description: 'Початок сеансу, ISO 8601, не в минулому',
  })
  @IsISO8601(
    { strict: true },
    { message: 'startsAt must be a valid ISO 8601 date' },
  )
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  @IsInt()
  @IsPositive()
  price: number;
}
