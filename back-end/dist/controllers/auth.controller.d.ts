import type { Request, Response } from "express";
export declare const authController: {
    register: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    login: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    refresh: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    logout: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    verifyOtp: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    uploadAvatar: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    deleteAvatar: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => Promise<unknown>;
};
//# sourceMappingURL=auth.controller.d.ts.map