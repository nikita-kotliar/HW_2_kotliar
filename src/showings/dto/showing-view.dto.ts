import { ApiProperty } from '@nestjs/swagger';

/** Сеанс для відповіді: назви фільму й залу замість ідентифікаторів. */
export class ShowingViewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  filmTitle: string;

  @ApiProperty({ example: 'Зал 1' })
  hallName: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  startsAt: Date;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;
}

/** Сторінка сеансів для GET /showings. */
export class ShowingsPageDto {
  @ApiProperty({ type: [ShowingViewDto] })
  items: ShowingViewDto[];

  @ApiProperty({
    example: 42,
    description: 'Кількість сеансів, що відповідають фільтрам',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
