import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth-middleware";

export const allowCorsFromOphanMiddleware = async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) => {
  if (request.headers.origin?.endsWith(".ophan.co.uk")) {
    response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
  }
  return next();
};
