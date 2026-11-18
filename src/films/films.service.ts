import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowingsService } from '../showings/showings.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';

@Injectable()
export class FilmsService {
  constructor(
    @InjectRepository(Film)
    private readonly filmsRepository: Repository<Film>,
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateFilmDto): Promise<Film> {
    return this.filmsRepository.save(this.filmsRepository.create(dto));
  }

  findAll(): Promise<Film[]> {
    return this.filmsRepository.find({ order: { title: 'ASC', id: 'ASC' } });
  }

  /** Повертає фільм або null: для перевірок з інших модулів. */
  find(id: string): Promise<Film | null> {
    return this.filmsRepository.findOneBy({ id });
  }

  async findOne(id: string): Promise<Film> {
    const film = await this.find(id);
    if (!film) {
      throw new NotFoundException(`Film with id "${id}" not found`);
    }
    return film;
  }

  async update(id: string, dto: UpdateFilmDto): Promise<Film> {
    const film = await this.findOne(id);
    this.filmsRepository.merge(film, dto);
    return this.filmsRepository.save(film);
  }

  async remove(id: string): Promise<void> {
    const film = await this.findOne(id);
    if (await this.showingsService.hasShowingsForFilm(film.id)) {
      throw new ConflictException(
        `Film with id "${id}" cannot be deleted: it is used by at least one showing`,
      );
    }
    await this.filmsRepository.delete(film.id);
  }
}
