import postgres from "postgres";

export type Sql = postgres.Sql<Record<string, unknown>>;
