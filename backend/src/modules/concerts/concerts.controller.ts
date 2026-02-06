import { concertService } from './concerts.service';
import { asyncHandler } from '../../common/utils/asyncHandler.util';
import { ResponseUtil } from '../../common/utils/response.utils';
import { SUCCESS_MESSAGES } from '@/common/constants/messages.constant';
import type { ConcertIdParamDto } from './dto/concert-id.dto';

export class ConcertController {
  /**
   * GET /api/concerts/:id
   * Get concert details by ID
   */
  getConcertById = asyncHandler<undefined, undefined, ConcertIdParamDto>(
    async (req, res): Promise<void> => {
      const { id } = req.validatedParams;

      const concert = await concertService.getConcertById(id);

      ResponseUtil.success(
        res,
        concert,
        SUCCESS_MESSAGES.CONCERT_RETRIEVED,
        200
      );
    }
  );

  /**
   * GET /api/concerts/:id/availability
   * Get ticket availability for a concert
   */
  getAvailability = asyncHandler<undefined, undefined, ConcertIdParamDto>(
    async (req, res): Promise<void> => {
      const { id } = req.validatedParams;

      const availability = await concertService.getAvailability(id);

      ResponseUtil.success(
        res,
        availability,
        SUCCESS_MESSAGES.AVAILABILITY_RETRIEVED,
        200
      );
    }
  );

  /**
   * GET /api/concerts
   * Get all concerts
   */
  getAllConcerts = asyncHandler(async (_req, res): Promise<void> => {
    const concerts = await concertService.getAllConcerts();

    ResponseUtil.success(
      res,
      concerts,
      SUCCESS_MESSAGES.CONCERTS_RETRIEVED,
      200
    );
  });
}

export const concertController = new ConcertController();
