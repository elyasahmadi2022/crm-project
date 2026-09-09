import { createContractSchema, updateContractSchema, listContractsQuerySchema, } from '../dtos/contract.dto.js';
import { paginationSchema } from '../dtos/common.dto.js';
import { contractService } from '../services/contract.service.js';
import { sendPaginated, sendSuccess } from '../utiles/api-response.utiles.js';
const parseId = (param) => parseInt(Array.isArray(param) ? (param[0] ?? '0') : (param ?? '0'), 10);
export const contractController = {
    getAll: async (req, res, next) => {
        try {
            const filters = listContractsQuerySchema.parse(req.query);
            const { page, limit } = paginationSchema.parse(req.query);
            const { contracts, pagination } = await contractService.getAll(filters, page, limit);
            return sendPaginated(res, contracts, pagination.page, pagination.limit, pagination.total);
        }
        catch (error) {
            next(error);
        }
    },
    getById: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const contract = await contractService.getById(id);
            return sendSuccess(res, contract);
        }
        catch (error) {
            next(error);
        }
    },
    create: async (req, res, next) => {
        try {
            const dto = createContractSchema.parse(req.body);
            const createdById = req.user.id;
            const contract = await contractService.create(dto, createdById);
            return sendSuccess(res, contract, 201);
        }
        catch (error) {
            next(error);
        }
    },
    update: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            const dto = updateContractSchema.parse(req.body);
            const contract = await contractService.update(id, dto);
            return sendSuccess(res, contract);
        }
        catch (error) {
            next(error);
        }
    },
    delete: async (req, res, next) => {
        try {
            const id = parseId(req.params.id);
            await contractService.delete(id);
            return sendSuccess(res, { success: true });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=contract.controller.js.map