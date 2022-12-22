import { getVerifiedUserEmail } from "../panDomainAuth";
import { userHasPermission } from "../permissionCheck";
import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../../shared/http/httpClientValues";

const MISSING_AUTH_COOKIE_MESSAGE =
  "pan-domain auth cookie missing, invalid or expired";

export interface AuthenticatedRequest extends Request {
  userEmail?: string;
}

export const getAuthMiddleware = (sendErrorAsOk = false) => async (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) => {
  console.log(sendErrorAsOk);
  const maybeCookieHeader = request.header("Cookie");
  const maybeAuthenticatedEmail = await getVerifiedUserEmail(maybeCookieHeader);

  if (!maybeAuthenticatedEmail) {
    return response
      .status(HTTP_STATUS_CODES.UNAUTHORIZED)
      .send(MISSING_AUTH_COOKIE_MESSAGE);
  }

  if (await userHasPermission(maybeAuthenticatedEmail)) {
    request.userEmail = maybeAuthenticatedEmail;
    return next();
  }

  response
    .status(HTTP_STATUS_CODES.FORBIDDEN)
    .send("You do not have permission to use PinBoard");
};
