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
  const maybeCookieHeader = request.header("Cookie");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  const maybeAuthenticatedEmail = await getVerifiedUserEmail(maybeCookieHeader);

  if (!maybeAuthenticatedEmail) {
    return sendErrorAsOk
      ? response.send(`console.error('${MISSING_AUTH_COOKIE_MESSAGE}')`)
      : response
          .status(HTTP_STATUS_CODES.UNAUTHORIZED)
          .send(MISSING_AUTH_COOKIE_MESSAGE);
  }

  if (await userHasPermission(maybeAuthenticatedEmail)) {
    request.userEmail = maybeAuthenticatedEmail;
    return next();
  }

  const NO_PINBOARD_PERMISSION_MESSAGE =
    "You do not have permission to use PinBoard";

  return sendErrorAsOk
    ? response.send(`console.log('${NO_PINBOARD_PERMISSION_MESSAGE}')`)
    : response
        .status(HTTP_STATUS_CODES.FORBIDDEN)
        .send(NO_PINBOARD_PERMISSION_MESSAGE);
};
