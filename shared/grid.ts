import { pinboardSecretPromiseGetter, STAGE } from "./awsIntegration";
import fetch from "node-fetch";

export const gridTopLevelDomain =
  STAGE === "PROD" ? "gutools.co.uk" : "test.dev-gutools.co.uk";

const loaderHost = `loader.media.${gridTopLevelDomain}`;

export const gridFetch = async <BODY extends Record<string, unknown>>(
  url: string,
  postBody?: BODY
): Promise<Record<string, unknown>> => {
  console.log(postBody);
  const response = await fetch(url, {
    method: postBody ? "POST" : "GET",
    headers: {
      "X-Gu-Media-Key": await pinboardSecretPromiseGetter(
        `grid/${STAGE === "PROD" ? "PROD" : "CODE"}/apiKey`
      ),
      ...(postBody && { "Content-Type": "application/json" }),
    },
    body: postBody && JSON.stringify(postBody),
  });

  if (response.ok) {
    // TODO perhaps also check the content type
    return await response.json();
  }
  throw new Error(
    `Failed to fetch ${url}: ${response.status} ${response.statusText}`
  );
};

interface GeneratePreSignedGridUploadUrlArgs {
  newGridId: string;
  filename: string;
  originalGridId: string;
  /* the email of the user who did the imaging work, who we'll use for on onBehalfOf*/
  userEmail: string;
}
export const generatePreSignedGridUploadUrl = async ({
  newGridId,
  filename,
  originalGridId,
  userEmail,
}: GeneratePreSignedGridUploadUrlArgs): Promise<string> => {
  const requestBody = {
    [newGridId]: filename,
  };
  const response = await gridFetch(
    `https://${loaderHost}/prepare?originalMediaId=${originalGridId}&onBehalfOf=${userEmail}`,
    requestBody
  );
  return response[newGridId] as string;
};
