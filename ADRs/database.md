# ADR: database

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

## Chosen Solution : RDS Postgres

Postgres (over MySQL or MariaDB) because we have more experience of it in the team (composer & workflow for example) and the wider stream/department.

This addresses all the limitations outlined above. The primary concern was how to replicate the behaviour we get from 'DynamoDB Streams' (to invoke the `notifications-lambda` on inserts into the Item table), fortunately [RDS supports invoking lambdas directly from within the DB engine](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/PostgreSQL-Lambda.html) and is in fact better, because we can perform all the joins and filters in the DB engine (in the insert trigger logic) to build the lambda payload (so the lambda needn't do queries back to the database - as it does at the moment) and conditionally invoke.

So far pinboard has remained totally serverless (all lambdas and AppSync - which is managed/serverless GraphQL) so we were hoping to do the same for the database (as DynamoDB is/was) as scaling is less of a concern and database cluster can be scaled down automatically to zero when not in use, especially in lower environments i.e. CODE). RDS Aurora has two serverless options (in addition to ...

- **Serverless V1** <br/>
  Supports the `data-api` (which is the only way AppSync can connect directly), but unfortunately doesn't support being assigned IAM permissions and so can't invoke the `notifications-lambda` directly (as described above) so we attempted a workaround in [#150](https://github.com/guardian/pinboard/pull/150) (using AppSync pipeline resolver and SQS queue) but abandoned this as it was too convoluted and the increased response time of this pipeline resolver was not really acceptable (when the user just wants to know their message is sent) - this decision was bolstered by anecdotal reports of woeful latency overhead of the data-api).
- **Serverless V2** <br/>
  Does support invoking the `notifications-lambda` direct from the DB although AppSync cannot connect directly, so we also need a new lambda `database-bridge-lambda` and arguably an RDS Proxt (to prevent the cluster being overwhelmed) - see https://aws.amazon.com/blogs/mobile/appsync-graphql-sql-rds-proxy. <br/>
  Unfortunately Serverless V2 clusters cannot be cloudformed/CDKed (as per https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbcluster.html#cfn-rds-dbcluster-enginemode and https://github.com/aws/aws-cdk/issues/20197) although it is on AWS' roadmap (see https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/1150) so we decided to manually create the cluster and reference it in the CDK stack, however the RDS Proxy repeatedly timed out cloudforming when referencing an imported database - so we cut our losses here too.
  <br/><br/>

Alas, the serverless options here simply weren't viable - so we gave up on those, but still wanted to use Aurora if possible as it's slightly more 'managed' than traditional RDS DB instances, so we tried cloudforming/CDKing an instance-based Aurora cluster (still with the RDS Proxy & Lambda detailed in the Serverless V2 section). Unfortunately due to https://github.com/aws/aws-cdk/issues/14262, it doesn't seem possible to create a Database Cluster using a 'looked-up' VPC - so abandoning that approach.

Furthermore, the cheapest available instance size for an Aurora cluster (`db.t4g.medium`) was $0.078 per hour (also the RDS Proxy charges are greater) compared to $0.017 per hour for a `db.t4g.micro` - which is possible with a **'traditional' RDS Postgres database instance - so that's what we ended up doing**.
