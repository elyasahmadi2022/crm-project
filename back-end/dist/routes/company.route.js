import { Router } from 'express';
import { UserRole } from '../generated/prisma/index.js';
import { asyncHandler } from '../utiles/error-handler.utiles.js';
import { authenticate, authorize } from '../middleware/auth.meddleware.js';
import { uploadAvatar } from '../middleware/upload.middleware.js';
import { companyController, contractTemplateController } from '../controllers/company.controller.js';
const router = Router();
// ── Company Settings ──────────────────────────────────────────────────────────
// Anyone authenticated can read; only ADMIN can write
router.get('/settings', authenticate, asyncHandler(companyController.get));
router.patch('/settings', authenticate, authorize(UserRole.ADMIN), asyncHandler(companyController.update));
router.post('/settings/logo', authenticate, authorize(UserRole.ADMIN), uploadAvatar, asyncHandler(companyController.uploadLogo));
router.delete('/settings/logo', authenticate, authorize(UserRole.ADMIN), asyncHandler(companyController.deleteLogo));
// ── Contract Templates ────────────────────────────────────────────────────────
router.get('/templates', authenticate, asyncHandler(contractTemplateController.getAll));
router.get('/templates/default', authenticate, asyncHandler(contractTemplateController.getDefault));
router.get('/templates/:id', authenticate, asyncHandler(contractTemplateController.getById));
router.post('/templates', authenticate, authorize(UserRole.ADMIN), asyncHandler(contractTemplateController.create));
router.put('/templates/:id', authenticate, authorize(UserRole.ADMIN), asyncHandler(contractTemplateController.update));
router.patch('/templates/:id/default', authenticate, authorize(UserRole.ADMIN), asyncHandler(contractTemplateController.setDefault));
router.patch('/templates/:id/layout', authenticate, authorize(UserRole.ADMIN), asyncHandler(contractTemplateController.saveLayout));
router.delete('/templates/:id', authenticate, authorize(UserRole.ADMIN), asyncHandler(contractTemplateController.delete));
export { router as companyRouter };
//# sourceMappingURL=company.route.js.map