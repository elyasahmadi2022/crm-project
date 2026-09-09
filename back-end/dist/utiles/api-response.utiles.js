export const sendSuccess = (res, data, statusCode = 200) => res.status(statusCode).json({ status: statusCode, data });
export const sendPaginated = (res, data, page, limit, total, statusCode = 200) => res.status(statusCode).json({
    status: statusCode,
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    },
});
export const sendError = (res, statusCode, message, errors) => res.status(statusCode).json({ status: statusCode, message, errors });
//# sourceMappingURL=api-response.utiles.js.map