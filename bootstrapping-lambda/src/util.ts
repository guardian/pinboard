import * as AWS from "aws-sdk";
import { Response } from "express";
import { STAGE, standardAwsConfig } from "../../shared/awsIntegration";
import { pbkdf2Sync } from "crypto";

const ssm = new AWS.SSM(standardAwsConfig);

// memoise fetched salt - memo is invalidated at midnight
// a failed fetch _is also memoised_!! this avoids lots of fetches if one fetch fails
const saltmemo = (async () => {
  let lastFetch = new Date();
  let salt: Buffer | undefined;

  const get = async () => {
    if (lastFetch.getUTCDate() === new Date().getUTCDate()) {
      return salt;
    }
    const saltParameter = ssm
      .getParameter({
        Name: `/pinboard/user-salt/${STAGE}`,
        WithDecryption: true,
      })
      .promise();

    const theSalt = (await saltParameter).Parameter?.Value;

    salt = theSalt ? Buffer.from(theSalt, "hex") : undefined;
    lastFetch = new Date();

    return salt;
  };

  // initial fetch
  await get();

  return {
    get,
  };
})();

const setCacheControlHeader = (response: Response, value: string): Response =>
  response.header("Cache-Control", value);

export const applyAggressiveCaching = (response: Response): void => {
  setCacheControlHeader(response, "public, max-age=604800, immutable");
};

export const applyNoCaching = (response: Response): void => {
  setCacheControlHeader(
    response,
    "private, no-cache, no-store, must-revalidate, max-age=0"
  );
};

export const applyJavascriptContentType = (response: Response): Response =>
  response.header("Content-Type", "application/javascript");

export const hashWithSalt = async (userEmail: string): Promise<string> => {
  const salt = await (await saltmemo).get();
  if (!salt) {
    // puts errors into our telemetry without breaking app for users
    return "UNABLE TO RETRIEVE SALT TO HASH USER";
  }

  const hash = pbkdf2Sync(
    Buffer.from(userEmail, "utf-8"),
    salt,
    1000,
    32,
    "sha512"
  );
  return hash.toString("hex");
};
