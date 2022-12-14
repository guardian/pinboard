import { Query, Mutation } from "./graphql";
import { assert, Equals } from "tsafe";

export const QUERIES = {
  database: [
    "listItems",
    "listLastItemSeenByUsers",
    "getMyUser",
    "searchMentionableUsers",
    "getUsers",
    "getGroupPinboardIds",
    "getItemCounts",
  ] as const,
  workflow: [
    "listPinboards",
    "getPinboardsByIds",
    "getPinboardByComposerId",
  ] as const,
  grid: ["getGridSearchSummary"] as const,
} as const;

type QueriesFromCodeGen = keyof Required<Omit<Query, "__typename">>;
const allQueries = [...QUERIES.database, ...QUERIES.workflow, ...QUERIES.grid];
type QueriesDefinedHere = typeof allQueries[number];

// if the below line fails TSC, it means that the list of Queries defined in the schema.graphql doesn't match the list defined in `QUERIES` above
assert<Equals<QueriesFromCodeGen, QueriesDefinedHere>>();

export const MUTATIONS = {
  database: [
    "createItem",
    "claimItem",
    "seenItem",
    "setWebPushSubscriptionForUser",
    "addManuallyOpenedPinboardIds",
    "removeManuallyOpenedPinboardIds",
  ] as const,
} as const;

type MutationsFromCodeGen = keyof Required<Omit<Mutation, "__typename">>;
const allMutations = [...MUTATIONS.database];
type MutationsDefinedHere = typeof allMutations[number];

// if the below line fails TSC, it means that the list of Mutations defined in the schema.graphql doesn't match the list defined in `MUTATIONS` above
assert<Equals<MutationsFromCodeGen, MutationsDefinedHere>>();

const allDatabaseOperations = [...QUERIES.database, ...MUTATIONS.database];
export type DatabaseOperation = typeof allDatabaseOperations[number];
