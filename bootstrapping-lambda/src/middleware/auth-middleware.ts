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
    console.warn(MISSING_AUTH_COOKIE_MESSAGE);
    response.status(401).send(MISSING_AUTH_COOKIE_MESSAGE);
  } else if (await userHasPermission(maybeAuthenticatedEmail)) {
    request.userEmail = maybeAuthenticatedEmail;
    next();
  } else {
    response.status(403).send("You do not have permission to use PinBoard");
  }
};
