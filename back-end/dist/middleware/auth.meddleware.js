import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/index.js";
// Crash at startup if the secret is missing — same guard as auth.service.ts
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!ACCESS_SECRET)
    throw new Error("Missing required env var: JWT_ACCESS_SECRET");
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: 401,
            message: "Access denied. No access token provided.",
            code: "TOKEN_MISSING"
        });
    }
    const token = authHeader.split(" ")[1] ?? "";
    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = { id: Number(decoded.id), role: decoded.role };
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: 401,
                message: "Access token has expired. Please refresh your session.",
                code: "TOKEN_EXPIRED"
            });
        }
        return res.status(401).json({
            status: 401,
            message: "Access token is invalid.",
            code: "TOKEN_INVALID"
        });
    }
};
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 403,
                message: "Access denied. You do not have permission to perform this action.",
                code: "FORBIDDEN"
            });
        }
        next();
    };
};
//# sourceMappingURL=auth.meddleware.js.map