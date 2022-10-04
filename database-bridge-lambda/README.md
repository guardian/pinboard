## `database-bridge-lambda`

This exists to interact with the RDS Postgres database (which has an RDS Proxy in front).

It is configured as a 'data source' in AppSync, and chooses what SQL to run base on which GraphQL query/mutation is requested (present in the `info.fieldName` parameter of the input payload).

This provides a nice single place where DB interactions are defined. We use [GraphQL Code Generator](https://graphql-code-generator.com/) to generate type definitions from the GraphQL schema (which we use across the whole project) but combined with [`tsafe`](https://www.npmjs.com/package/tsafe) in [`/shared/graphql/operations.ts`](../shared/graphql/operations.ts) and [`@typescript-eslint/switch-exhaustiveness-check`](https://typescript-eslint.io/rules/switch-exhaustiveness-check/) we guarantee at compile time that we have a handler for every database related GraphQL query/mutation. We also iterate this list in the [`/cdk/stacks.ts`](../cdk/stacks.ts) to generate the AppSync resolvers for each GraphQL query/mutation.
