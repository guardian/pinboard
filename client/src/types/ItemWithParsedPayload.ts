import { Item } from "shared/graphql/graphql";

export type ItemWithParsedPayload = Omit<Item, "payload"> & {
  payload: Record<string, unknown> | null | undefined;
};
