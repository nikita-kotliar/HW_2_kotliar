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
import { CreateHallDto } from './dto/create-hall.dto';
import { HallWithSeatsDto } from './dto/hall-with-seats.dto';
import { Hall } from './entities/hall.entity';
import { HallsService } from './halls.service';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiCreatedResponse({ type: Hall, description: 'Зал створено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Поле відсутнє, має неправильний тип або не є цілим додатним',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Зал з такою назвою вже існує',
  })
  create(@Body() dto: CreateHallDto): Promise<Hall> {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [Hall], description: 'Масив усіх залів' })
  findAll(): Promise<Hall[]> {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    type: HallWithSeatsDto,
    description: 'Зал з переліком місць',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є UUID',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Залу з таким id немає',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<HallWithSeatsDto> {
    return this.hallsService.findOneWithSeats(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Зал видалено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є UUID',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Залу з таким id немає',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'На зал посилається хоча б один сеанс',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.hallsService.remove(id);
  }
}
