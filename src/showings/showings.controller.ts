import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { CreateShowingDto } from './dto/create-showing.dto';
import { ShowingsPageDto, ShowingViewDto } from './dto/showing-view.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { Showing } from './entities/showing.entity';
import { ShowingsService } from './showings.service';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiCreatedResponse({ type: Showing, description: 'Сеанс створено' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'Фільму або залу немає; startsAt некоректна або в минулому; price не ціле додатне',
  })
  create(@Body() dto: CreateShowingDto): Promise<Showing> {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: ShowingsPageDto,
    description:
      'Сторінка сеансів, відсортованих за часом початку, при рівності за id',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description:
      'page/limit не ціле число або поза межами; date не YYYY-MM-DD; sort не asc/desc; filmId не UUID',
  })
  findAll(@Query() query: ShowingsQueryDto): Promise<ShowingsPageDto> {
    return this.showingsService.findPage(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ShowingViewDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'id не є UUID',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Сеансу з таким id немає',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ShowingViewDto> {
    return this.showingsService.findOneView(id);
  }
}
