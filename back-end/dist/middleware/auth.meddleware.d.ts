import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma/index.js";
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.meddleware.d.ts.map