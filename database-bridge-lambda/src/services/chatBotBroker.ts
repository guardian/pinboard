import { Item } from "shared/graphql/graphql";
import { ssm, STAGE, standardAwsConfig } from "shared/awsIntegration";
import {
  GetResourceShareAssociationsCommand,
  GetResourceSharesCommand,
  RAMClient,
} from "@aws-sdk/client-ram";
import { Lambda } from "@aws-sdk/client-lambda";

const sharedAwsResources = new RAMClient(standardAwsConfig);
const lambda = new Lambda(standardAwsConfig);
const { encode } = new TextEncoder();

export interface ChatBotDetails {
  shorthand: string;
  description: string;
  lambdaArn: string;
}

// FIXME need to cache this somehow, perhaps sync to DB in user-refresher-lambda (so it can be JOINED like users/groups)
export const getBots = async (
  maybeStartToken?: string
): Promise<ChatBotDetails[]> => {
  return Promise.resolve([
    {
      shorthand: "ChatGuPT",
      description: "An example/test bot for the Pinboard service",
      lambdaArn:
        "arn:aws:lambda:eu-west-1:702972749545:function:pinboard-test-bot",
    },
  ]);

  const { resourceShares, nextToken } = await sharedAwsResources.send(
    new GetResourceSharesCommand({
      resourceOwner: "OTHER-ACCOUNTS",
      resourceShareStatus: "ACTIVE",
      nextToken: maybeStartToken,
    })
  );

  // FIXME retrieve SSM arn from resourceShares

  const maybeThisPagePromises = resourceShares?.reduce(
    (acc, { resourceShareArn }) =>
      resourceShareArn /*?.includes(`/pinboard/bots/${STAGE}/`)*/
        ? [
            ...acc,
            ssm
              .getParameterHistory({
                Name: resourceShareArn,
                MaxResults: 1, //TODO check this returns latest
              })
              .then((_) => _!.Parameters![0])
              .then(({ Description, Value }) => ({
                shorthand: resourceShareArn.split("/").pop()!,
                description: Description!,
                lambdaArn: Value!,
              })),
          ]
        : acc,
    [] as Promise<ChatBotDetails>[]
  );

  return [
    ...(nextToken ? await getBots(nextToken) : []),
    ...(await Promise.all(maybeThisPagePromises || [])),
  ];
};

export const processAllBotMentions = (
  allItemsInThisPinboard: Item[],
  newItem: Item,
  chatBotMentions: string[]
): Promise<void>[] =>
  chatBotMentions.map(async (chatBotShorthand) => {
    const allBots = await getBots();

    const chatBot = allBots.find((_) => _.shorthand === chatBotShorthand);

    if (!chatBot) {
      return console.error(
        "could not find chatbot with shorthand: ",
        chatBotShorthand
      );
    }

    console.log("invoking chatbot: ", chatBot.shorthand, chatBot.lambdaArn);
    console.log(
      await lambda.invoke({
        FunctionName: chatBot.lambdaArn,
        // asynchronous invocation, so we can exit the create call early (and hope the bot replies in due course)
        InvocationType: "Event",
        Payload: encode(
          JSON.stringify({
            callbackToken: "", //TODO implement single-use callback token mechanism
            callbackUrl: `https://pinboard.${
              STAGE === "PROD" ? "gutools.co.uk" : "code.dev-gutools.co.uk"
            }/bot/${newItem.pinboardId}/${newItem.id}`,
            item: newItem,
            allItemsInThisPinboard: allItemsInThisPinboard,
            //TODO share composer ID so bot can fetch content if needs be
          })
        ),
      })
    );
  });
