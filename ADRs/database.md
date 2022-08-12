# ADR: database

_Initially written 8th August 2012, but there are some updates._

## Current Scenario : DynamoDB

When getting started with AWS AppSync (TODO add ADR for this), DynamoDB is an easy choice for persisting data and has served us very well so far, primarily for the following reasons...

- pay by usage (i.e. no server provisioning required) - and very cheap for our level of use
- semi-structured (no table structure required up-front, other than partition key, and optionally sort key) - which has allowed us to iterate quickly on the shape of our tables
- straight-forward AppSync connection & resolvers to read/write data
- useful features such as TTL (which we made use of to purge inactive users, although functionality superseded in https://github.com/guardian/pinboard/pull/123)

- 'DynamoDB Streams' which we use to invoke the `notifications-lambda` on inserts into the Item table (for desktop notifications, a.k.a. web-push notifications)

### Limitations we've experienced and anticipate for future features

- proprietary JSON read/write mechanism - unfamiliar to most DEVs and hard to use/remember even for those devs experienced with DynamoDB - this has arguably been growing tech debt, as pinboard has grown in complexity.
- query performance for queries which don't quite fit the storage structure (when compared to generic SQL), more crucially **joining tables is not possible** - leading us to consider extra tables with duplicate information 🤮

- no aggregation functions (such as max, count etc.)

- no mechanism for sequential IDs (useful for doing proper unread counts - we can currently only detect if there are unread messages or not - by comparing to a 'last seen' table)

## Other Choices

Assuming we stick with AWS AppSync (managed GraphQL) - which we are as it provides a nice abstraction over the data source(s) and realtime integration (web sockets abstraction), we are limited to a few choices...

| Choice                                        | Comments                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DynamoDB                                      | Using currently, see limitations above                                                                                                                                                                                                                                                                                        |
| OpenSearch (AWS ElasticSearch implementation) | Too much infrastructure for our current requirements and suffers from some of the limitations above, such as not being able to join                                                                                                                                                                                           |
| Lambda function                               | Would still need to actually persist the date somewhere, so this is not relevant (although we do use it for interacting with workflow, see [`workflow-bridge-lambda`](../README.md#workflow-bridge-lambda). <br/> We may need to consider this if using SQL in the resolvers proves to be restrictive.                        |
| HTTP Endpoint                                 | Like lambda, we would still need to actually persist the date somewhere, so this is not relevant.                                                                                                                                                                                                                             |
| RDS                                           | AWS' Relational Database Service, looks suitable for addressing all of the limitations outlined above. <br/> Importantly though, AppSync only supports serverless RDS (a.k.a. Aurora) and only V1 (because it use the [data-api](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) under the hood). |

With RDS Aurora being the only option, this leaves us with the choice of MySQL vs Postgres from the DB engine - so we're choosing Postgres mainly based on familiarity in the team (composer & workflow DBs are Postgres).

## Chosen Solution : RDS Aurora (Postgres flavour)

This addresses all the limitations outlined above. The primary concern was how to replicate the behaviour we get from 'DynamoDB Streams' (to invoke the `notifications-lambda` on inserts into the Item table), ~~fortunately [RDS Aurora supports invoking lambdas directly from within the DB engine](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/PostgreSQL-Lambda.html) and is in fact better, because we can perform all the joins and filters in the DB engine (in the insert trigger logic) to build the lambda payload (so the lambda needn't do queries back to the database - as it does at the moment) and conditionally invoke.~~ **UPDATE 10th August 2022...**
upon further investigation/experimentation, due to the fact we must use Aurora ServerlessV1 (because it's the only thing which supports the `data-api`, which AppSync relies upon) this doesn't support attaching IAM roles and so we cannot permission the RDS cluster to invoke the lambda - putting an end to that approach. That leaves us with two choices...

- ~~add a lambda and RDS proxy between AppSync and RDS (as explained in https://aws.amazon.com/blogs/mobile/appsync-graphql-sql-rds-proxy)~~ - this seems like too much infrastructure complexity (at this point)
- convert the `createItem` AppSync resolver to an AppSync 'pipeline' resolver, where the first function does the DB insert as before, then the second function invokes the lambda (and we leave the lambda to look-up what it needs to from the DB, a shame but worth it). To avoid the user/client waiting on all the notifications being sent before they know their message has been inserted, the lambda invoked from the pipeline resolver just queues the item to be dealt with later, so the resolver can return as quickly as possible (unfortunately there's no async invoke of lambdas from AppSync as far as we could find out) - **this work is done in https://github.com/guardian/pinboard/pull/150.**
