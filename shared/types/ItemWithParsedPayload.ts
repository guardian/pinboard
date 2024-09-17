import { Item } from "../graphql/graphql";

export type ItemWithParsedPayload = Omit<Item, "payload"> & {
  payload: Record<string, unknown> | null | undefined;
};
