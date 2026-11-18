import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BookingsService } from './bookings.service';
import {
  BookingResponseDto,
  SeatAvailabilityDto,
} from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOkResponse({ type: [BookingResponseDto], description: 'Усі бронювання' })
  findAll(): Promise<BookingResponseDto[]> {
    return this.bookingsService.findAll();
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Бронювання скасовано, місця вільні' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є UUID',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Бронювання з таким id немає',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.bookingsService.remove(id);
  }

  @Post('showings/:id/bookings')
  @ApiParam({ name: 'id', format: 'uuid', description: 'id сеансу' })
  @ApiCreatedResponse({
    type: BookingResponseDto,
    description: 'Бронювання створено',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'seats порожній, елемент без row/seat, місце повторюється або його немає в залі',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Хоча б одне місце вже заброньоване; нічого не записано',
  })
  create(
    @Param('id', ParseUUIDPipe) showingId: string,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiParam({ name: 'id', format: 'uuid', description: 'id сеансу' })
  @ApiOkResponse({
    type: [BookingResponseDto],
    description: 'Бронювання сеансу',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є UUID',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  findByShowing(
    @Param('id', ParseUUIDPipe) showingId: string,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findByShowing(showingId);
  }

  @Get('showings/:id/seats')
  @ApiParam({ name: 'id', format: 'uuid', description: 'id сеансу' })
  @ApiOkResponse({
    type: [SeatAvailabilityDto],
    description: 'Усі місця залу з ознакою зайнятості на сеансі',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є UUID',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  getSeats(
    @Param('id', ParseUUIDPipe) showingId: string,
  ): Promise<SeatAvailabilityDto[]> {
    return this.bookingsService.getSeats(showingId);
  }
}
