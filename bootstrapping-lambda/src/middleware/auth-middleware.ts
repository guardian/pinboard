import { getVerifiedUserEmail } from "../panDomainAuth";
import { userHasPermission } from "../permissionCheck";
import { NextFunction, Request, Response } from "express";

const MISSING_AUTH_COOKIE_MESSAGE =
  "pan-domain auth cookie missing, invalid or expired";

export interface AuthenticatedRequest extends Request {
  userEmail?: string;
}

export const authMiddleware = async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) => {
  const maybeCookieHeader = request.header("Cookie");
  const maybeAuthenticatedEmail = await getVerifiedUserEmail(maybeCookieHeader);

  if (!maybeAuthenticatedEmail) {
    return response.status(401).send(MISSING_AUTH_COOKIE_MESSAGE);
  }

  if (await userHasPermission(maybeAuthenticatedEmail)) {
    request.userEmail = maybeAuthenticatedEmail;
    return next();
  }

  response.status(403).send("You do not have permission to use PinBoard");
};
