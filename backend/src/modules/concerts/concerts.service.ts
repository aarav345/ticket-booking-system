import { NotFoundError } from '../../common/errors/app.error';
import {
  ERROR_MESSAGES,
  RESOURCE_NAMES,
} from '@/common/constants/messages.constant';

import { concertRepository } from './concerts.repository';
import type { Concert, TicketAvailability } from './concerts.types';

export class ConcertService {
  async getConcertById(concertId: string): Promise<Concert> {
    const concert = await concertRepository.findById(concertId);

    if (!concert) {
      throw new NotFoundError(
        ERROR_MESSAGES.CONCERT_NOT_FOUND,
        RESOURCE_NAMES.CONCERT,
        concertId
      );
    }

    return concert;
  }

  async getAvailability(concertId: string): Promise<TicketAvailability[]> {
    const concertExists = await concertRepository.exists(concertId);
    if (!concertExists) {
      throw new NotFoundError(
        ERROR_MESSAGES.CONCERT_NOT_FOUND,
        RESOURCE_NAMES.CONCERT,
        concertId
      );
    }

    const availability =
      await concertRepository.getTicketAvailability(concertId);

    if (availability.length === 0) {
      throw new NotFoundError(
        ERROR_MESSAGES.NO_TIERS_FOUND,
        RESOURCE_NAMES.TICKET_TIER,
        concertId
      );
    }

    return availability;
  }

  async getAllConcerts(): Promise<Concert[]> {
    return concertRepository.findAll();
  }
}

export const concertService = new ConcertService();
