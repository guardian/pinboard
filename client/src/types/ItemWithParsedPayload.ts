import { Item } from "../../../shared/graphql/graphql";

export type ItemWithParsedPayload = Item & {
  payload: Record<string, unknown> | null | undefined;
};
