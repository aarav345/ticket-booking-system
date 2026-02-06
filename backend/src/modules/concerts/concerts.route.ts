import { Router } from 'express';
import { concertController } from './concerts.controller';
import { validateParams } from '../../common/middlewares/validation.middleware';
import { ConcertIdParamSchema } from './dto/concert-id.dto';

const router = Router();

/**
 * @route   GET /api/v1/concerts
 * @desc    Get all concerts
 * @access  Public
 */
router.get('/', concertController.getAllConcerts);

/**
 * @route   GET /api/v1/concerts/:id
 * @desc    Get concert by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateParams(ConcertIdParamSchema),
  concertController.getConcertById
);

/**
 * @route   GET /api/v1/concerts/:id/availability
 * @desc    Get ticket availability for a concert
 * @access  Public
 */
router.get(
  '/:id/availability',
  validateParams(ConcertIdParamSchema),
  concertController.getAvailability
);

export default router;
