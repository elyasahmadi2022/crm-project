import { Router } from 'express';
import { UserRole } from '../generated/prisma/index.js';
import { asyncHandler } from '../utiles/error-handler.utiles.js';
import { authenticate, authorize } from '../middleware/auth.meddleware.js';
import { contractController } from '../controllers/contract.controller.js';

const router = Router();

// Any authenticated user can read contracts; writes require ADMIN or SALES
router.get(
  '/',
  authenticate,
  asyncHandler(contractController.getAll),
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(contractController.getById),
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SALES),
  asyncHandler(contractController.create),
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SALES),
  asyncHandler(contractController.update),
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(contractController.delete),
);

export { router as contractRouter };
