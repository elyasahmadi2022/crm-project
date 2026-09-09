import path from 'path';
import fs from 'fs';
import { updateCompanySettingsSchema, upsertContractTemplateSchema } from '../dtos/company.dto.js';
import { companyService, contractTemplateService } from '../services/company.service.js';
import { sendSuccess } from '../utiles/api-response.utiles.js';
const parseId = (p) => parseInt(Array.isArray(p) ? (p[0] ?? '0') : (p ?? '0'), 10);
// ── Company Settings ──────────────────────────────────────────────────────────
export const companyController = {
    get: async (_req, res, next) => {
        try {
            return sendSuccess(res, await companyService.get());
        }
        catch (e) {
            next(e);
        }
    },
    update: async (req, res, next) => {
        try {
            const dto = updateCompanySettingsSchema.parse(req.body);
            return sendSuccess(res, await companyService.update(dto));
        }
        catch (e) {
            next(e);
        }
    },
    uploadLogo: async (req, res, next) => {
        try {
            if (!req.file) {
                res.status(400).json({ status: 400, message: 'No file uploaded.' });
                return;
            }
            const baseUrl = process.env.BACKEND_URL ?? 'http://localhost:4444';
            const uploadDir = process.env.UPLOAD_DIR ?? 'uploads/avatars';
            const logoUrl = `${baseUrl}/${uploadDir}/${req.file.filename}`;
            return sendSuccess(res, await companyService.updateLogo(logoUrl));
        }
        catch (e) {
            next(e);
        }
    },
    deleteLogo: async (req, res, next) => {
        try {
            const current = await companyService.get();
            if (current.logoUrl) {
                // Best-effort local file deletion
                try {
                    const uploadDir = process.env.UPLOAD_DIR ?? 'uploads/avatars';
                    const filename = path.basename(current.logoUrl);
                    const filePath = path.resolve(uploadDir, filename);
                    if (fs.existsSync(filePath))
                        fs.unlinkSync(filePath);
                }
                catch { /* ignore */ }
            }
            return sendSuccess(res, await companyService.updateLogo(null));
        }
        catch (e) {
            next(e);
        }
    },
};
// ── Contract Templates ────────────────────────────────────────────────────────
export const contractTemplateController = {
    getAll: async (_req, res, next) => {
        try {
            return sendSuccess(res, await contractTemplateService.getAll());
        }
        catch (e) {
            next(e);
        }
    },
    getDefault: async (_req, res, next) => {
        try {
            const t = await contractTemplateService.getDefault();
            return sendSuccess(res, t);
        }
        catch (e) {
            next(e);
        }
    },
    getById: async (req, res, next) => {
        try {
            return sendSuccess(res, await contractTemplateService.getById(parseId(req.params.id)));
        }
        catch (e) {
            next(e);
        }
    },
    create: async (req, res, next) => {
        try {
            const dto = upsertContractTemplateSchema.parse(req.body);
            return sendSuccess(res, await contractTemplateService.create(dto), 201);
        }
        catch (e) {
            next(e);
        }
    },
    update: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const raw = upsertContractTemplateSchema.partial().parse(req.body);
            // Strip undefined to satisfy exactOptionalPropertyTypes
            const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined));
            return sendSuccess(res, await contractTemplateService.update(id, dto));
        }
        catch (e) {
            next(e);
        }
    },
    setDefault: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            return sendSuccess(res, await contractTemplateService.update(id, { isDefault: true }));
        }
        catch (e) {
            next(e);
        }
    },
    delete: async (req, res, next) => {
        try {
            await contractTemplateService.delete(parseId(req.params.id));
            return sendSuccess(res, { success: true });
        }
        catch (e) {
            next(e);
        }
    },
    /** PATCH /templates/:id/layout — saves the canvas JSON blob only */
    saveLayout: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const { layoutJson } = req.body;
            if (typeof layoutJson !== 'string' || !layoutJson.trim()) {
                res.status(400).json({ status: 400, message: 'layoutJson is required and must be a non-empty string.' });
                return;
            }
            // Quick structural validation — must parse as JSON with a "version" field
            let parsed;
            try {
                parsed = JSON.parse(layoutJson);
            }
            catch {
                res.status(400).json({ status: 400, message: 'layoutJson is not valid JSON.' });
                return;
            }
            if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
                res.status(400).json({ status: 400, message: 'layoutJson must contain a "version" field.' });
                return;
            }
            return sendSuccess(res, await contractTemplateService.update(id, { layoutJson }));
        }
        catch (e) {
            next(e);
        }
    },
};
//# sourceMappingURL=company.controller.js.map