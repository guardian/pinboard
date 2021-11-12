import { getVerifiedUserEmailFromPandaCookieValue } from "../../shared/panDomainAuth";

exports.handler = async (event: { authorizationToken?: string }) => {
  const maybeAuthedUserEmail = await getVerifiedUserEmailFromPandaCookieValue(
    event.authorizationToken
  );

  // TODO is this sufficient? (does this expire after 1h or 90d)
  if (maybeAuthedUserEmail) {
    return {
      isAuthorized: true,
      resolverContext: {
        userEmail: maybeAuthedUserEmail,
      },
    };
  } else {
    return {
      isAuthorized: false,
    };
  }
};
