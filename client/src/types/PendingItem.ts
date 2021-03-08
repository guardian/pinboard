import { Item } from "../../../shared/graphql/graphql";

export interface PendingItem extends Item {
  pending: true;
}
