import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import { ShowingsService } from '../showings/showings.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { HallWithSeatsDto, SeatPositionDto } from './dto/hall-with-seats.dto';
import { Hall } from './entities/hall.entity';

@Injectable()
export class HallsService {
  constructor(
    @InjectRepository(Hall)
    private readonly hallsRepository: Repository<Hall>,
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  async create(dto: CreateHallDto): Promise<Hall> {
    const name = dto.name.trim();
    const duplicate = () =>
      new ConflictException(`Hall with name "${name}" already exists`);

    const taken = await this.hallsRepository
      .createQueryBuilder('hall')
      .where('LOWER(hall.name) = LOWER(:name)', { name })
      .getExists();
    if (taken) throw duplicate();

    try {
      return await this.hallsRepository.save(
        this.hallsRepository.create({ ...dto, name }),
      );
    } catch (error) {
      // Паралельний запит із тією ж назвою: спрацював унікальний індекс.
      if (isUniqueViolation(error)) throw duplicate();
      throw error;
    }
  }

  findAll(): Promise<Hall[]> {
    return this.hallsRepository.find({ order: { name: 'ASC' } });
  }

  /** Повертає зал або null: для перевірок з інших модулів. */
  find(id: string): Promise<Hall | null> {
    return this.hallsRepository.findOneBy({ id });
  }

  async findOne(id: string): Promise<Hall> {
    const hall = await this.find(id);
    if (!hall) {
      throw new NotFoundException(`Hall with id "${id}" not found`);
    }
    return hall;
  }

  async findOneWithSeats(id: string): Promise<HallWithSeatsDto> {
    const hall = await this.findOne(id);
    return { ...hall, seats: this.getSeats(hall) };
  }

  /** Перелік місць залу: ряди 1..rows, у кожному місця 1..seatsPerRow. */
  getSeats(hall: Hall): SeatPositionDto[] {
    const seats: SeatPositionDto[] = [];
    for (let row = 1; row <= hall.rows; row++) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat++) {
        seats.push({ row, seat });
      }
    }
    return seats;
  }

  hasSeat(hall: Hall, seat: SeatPositionDto): boolean {
    return (
      seat.row >= 1 &&
      seat.row <= hall.rows &&
      seat.seat >= 1 &&
      seat.seat <= hall.seatsPerRow
    );
  }

  async remove(id: string): Promise<void> {
    const hall = await this.findOne(id);
    if (await this.showingsService.hasShowingsForHall(hall.id)) {
      throw new ConflictException(
        `Hall with id "${id}" cannot be deleted: it is used by at least one showing`,
      );
    }
    await this.hallsRepository.delete(hall.id);
  }
}
