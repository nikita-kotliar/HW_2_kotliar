import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilmsService } from '../films/films.service';
import { HallsService } from '../halls/halls.service';
import { CreateShowingDto } from './dto/create-showing.dto';
import { ShowingsPageDto, ShowingViewDto } from './dto/showing-view.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { Showing } from './entities/showing.entity';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ShowingsService {
  constructor(
    @InjectRepository(Showing)
    private readonly showingsRepository: Repository<Showing>,
    @Inject(forwardRef(() => FilmsService))
    private readonly filmsService: FilmsService,
    @Inject(forwardRef(() => HallsService))
    private readonly hallsService: HallsService,
  ) {}

  async create(dto: CreateShowingDto): Promise<Showing> {
    if (!(await this.filmsService.find(dto.filmId))) {
      throw new BadRequestException(`Film with id "${dto.filmId}" not found`);
    }
    if (!(await this.hallsService.find(dto.hallId))) {
      throw new BadRequestException(`Hall with id "${dto.hallId}" not found`);
    }
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException('startsAt must not be in the past');
    }

    return this.showingsRepository.save(
      this.showingsRepository.create({
        filmId: dto.filmId,
        hallId: dto.hallId,
        startsAt,
        price: dto.price,
      }),
    );
  }

  /** Фільтрація, сортування й LIMIT/OFFSET виконуються одним запитом до БД. */
  async findPage(query: ShowingsQueryDto): Promise<ShowingsPageDto> {
    const { filmId, date, page, limit, sort } = query;

    const qb = this.showingsRepository
      .createQueryBuilder('showing')
      .innerJoinAndSelect('showing.film', 'film')
      .innerJoinAndSelect('showing.hall', 'hall');

    if (filmId) {
      qb.andWhere('showing.filmId = :filmId', { filmId });
    }
    if (date) {
      const from = new Date(`${date}T00:00:00.000Z`);
      const to = new Date(from.getTime() + DAY_MS);
      qb.andWhere('showing.startsAt >= :from AND showing.startsAt < :to', {
        from,
        to,
      });
    }

    const [rows, total] = await qb
      .orderBy('showing.startsAt', sort === 'desc' ? 'DESC' : 'ASC')
      .addOrderBy('showing.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items: rows.map((s) => this.toView(s)), total, page, limit };
  }

  /** Сирий запис сеансу разом із залом: для інших модулів. */
  async findOne(id: string): Promise<Showing> {
    const showing = await this.showingsRepository.findOne({
      where: { id },
      relations: { hall: true },
    });
    if (!showing) {
      throw new NotFoundException(`Showing with id "${id}" not found`);
    }
    return showing;
  }

  async findOneView(id: string): Promise<ShowingViewDto> {
    const showing = await this.showingsRepository.findOne({
      where: { id },
      relations: { film: true, hall: true },
    });
    if (!showing) {
      throw new NotFoundException(`Showing with id "${id}" not found`);
    }
    return this.toView(showing);
  }

  hasShowingsForFilm(filmId: string): Promise<boolean> {
    return this.showingsRepository.existsBy({ filmId });
  }

  hasShowingsForHall(hallId: string): Promise<boolean> {
    return this.showingsRepository.existsBy({ hallId });
  }

  private toView(showing: Showing): ShowingViewDto {
    return {
      id: showing.id,
      filmTitle: showing.film.title,
      hallName: showing.hall.name,
      startsAt: showing.startsAt,
      price: showing.price,
    };
  }
}
