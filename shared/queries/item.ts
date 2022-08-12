import postgres from "postgres";
import { CreateItemInput, Item } from "../graphql/graphql";

const sql = postgres({});

export const insertItem = async (item: CreateItemInput, userEmail: string) => {
  return await sql`
        INSERT INTO Item ${sql({ userEmail, ...item })}
    `;
};

const listItems = async (pinboardId: string): Item => {
  return await sql`
        SELECT ???
    `;
};
