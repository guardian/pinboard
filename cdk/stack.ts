import {
  App,
  CfnMapping,
  CfnOutput,
  CfnParameter,
  Duration,
  Fn,
  Stack,
  StackProps,
  Tags,
  aws_lambda as lambda,
  aws_s3 as S3,
  aws_iam as iam,
  aws_ssm as ssm,
  aws_apigateway as apiGateway,
  aws_dynamodb as db,
  aws_certificatemanager as acm,
  aws_ec2 as ec2,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_rds as rds,
} from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { join } from "path";
import { APP } from "../shared/constants";
import crypto from "crypto";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { ENVIRONMENT_VARIABLE_KEYS } from "../shared/environmentVariables";

export class PinBoardStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisStack = this;

    const context = Stack.of(this);
    const account = context.account;
    const region = context.region;

    // if changing should also change .nvmrc (at the root of repo)
    const LAMBDA_NODE_VERSION = lambda.Runtime.NODEJS_14_X;

    const STACK = new CfnParameter(thisStack, "Stack", {
      type: "String",
      description: "Stack",
    }).valueAsString;

    const STAGE = new CfnParameter(thisStack, "Stage", {
      type: "String",
      description: "Stage",
    }).valueAsString;

    Tags.of(thisStack).add("App", APP);
    Tags.of(thisStack).add("Stage", STAGE);
    Tags.of(thisStack).add("Stack", STACK);

    const accountVpc = ec2.Vpc.fromVpcAttributes(thisStack, "AccountVPC", {
      vpcId: ssm.StringParameter.valueForStringParameter(
        thisStack,
        "/account/vpc/primary/id"
      ),
      availabilityZones: Fn.getAzs(region),
      privateSubnetIds: Fn.split(
        ",",
        ssm.StringParameter.valueForStringParameter(
          thisStack,
          "/account/vpc/primary/subnets/private"
        )
      ),
    });

    const dbName = "pinboard";
    /*
     * As per https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-rds-dbcluster.html#cfn-rds-dbcluster-enginemode
     * and https://github.com/aws/aws-cdk/issues/20197 CloudFormation/CDK doesn't officially support ServerlessV2 yet, although it is on
     * AWS' roadmap - see https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/1150
     *
     * In the meantime, we created the serverless cluster manually, so we look it up below.
     * */
    const database = rds.DatabaseCluster.fromDatabaseClusterAttributes(
      this,
      `Database`,
      {
        clusterIdentifier: `${APP}-database-${STAGE}`,
        engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
        port: 5432,
      }
    );

    const dbSecret = new rds.DatabaseSecret(this, "DatabaseSecret", {
      username: "pinboard",
    });

    const databaseProxy = database.addProxy("DatabaseProxy", {
      secrets: [dbSecret],
      iamAuth: true,
      vpc: accountVpc,
    });

    const deployBucket = S3.Bucket.fromBucketName(
      thisStack,
      "workflow-dist",
      "workflow-dist"
    );

    const readPinboardParamStorePolicyStatement = new iam.PolicyStatement({
      actions: ["ssm:GetParameter"],
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:ssm:${region}:${account}:parameter/${APP}/*`],
    });

    const permissionsFilePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [`arn:aws:s3:::permissions-cache/${STAGE}/*`],
    });

    const pandaConfigAndKeyPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [`arn:aws:s3:::pan-domain-auth-settings/*`],
    });

    const workflowBridgeLambdaBasename = "pinboard-workflow-bridge-lambda";

    const workflowDatastoreVpcId = Fn.importValue(
      `WorkflowDatastoreLoadBalancerSecurityGroupVpcId-${STAGE}`
    );

    const workflowDatastoreVPC = ec2.Vpc.fromVpcAttributes(
      thisStack,
      "workflow-datastore-vpc",
      {
        vpcId: workflowDatastoreVpcId,
        availabilityZones: Fn.getAzs(region),
        privateSubnetIds: Fn.split(
          ",",
          Fn.importValue(`WorkflowPrivateSubnetIds-${STAGE}`)
        ),
      }
    );

    const pinboardWorkflowBridgeLambda = new lambda.Function(
      thisStack,
      workflowBridgeLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.workflowDnsName]: Fn.importValue(
            `WorkflowDatastoreLoadBalancerDNSName-${STAGE}`
          ),
        },
        functionName: `${workflowBridgeLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${workflowBridgeLambdaBasename}/${workflowBridgeLambdaBasename}.zip`
        ),
        role: new iam.Role(thisStack, `${workflowBridgeLambdaBasename}-role`, {
          assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "service-role/AWSLambdaBasicExecutionRole"
            ),
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              "service-role/AWSLambdaVPCAccessExecutionRole"
            ),
          ],
        }),
        vpc: workflowDatastoreVPC,
        securityGroups: [
          ec2.SecurityGroup.fromSecurityGroupId(
            thisStack,
            "workflow-datastore-load-balancer-security-group",
            Fn.importValue(
              `WorkflowDatastoreLoadBalancerSecurityGroupId-${STAGE}`
            )
          ),
        ],
      }
    );

    const gridBridgeLambdaBasename = "pinboard-grid-bridge-lambda";

    const pinboardGridBridgeLambda = new lambda.Function(
      thisStack,
      gridBridgeLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
        },
        functionName: `${gridBridgeLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${gridBridgeLambdaBasename}/${gridBridgeLambdaBasename}.zip`
        ),
        initialPolicy: [readPinboardParamStorePolicyStatement],
      }
    );

    const databaseBridgeLambdaBasename = "pinboard-database-bridge-lambda";

    const pinboardDatabaseBridgeLambda = new lambda.Function(
      thisStack,
      databaseBridgeLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
        },
        functionName: `${databaseBridgeLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${databaseBridgeLambdaBasename}/${databaseBridgeLambdaBasename}.zip`
        ),
        initialPolicy: [],
      }
    );

    databaseProxy.grantConnect(pinboardDatabaseBridgeLambda);

    const pinboardUserTableBaseName = "pinboard-user-table";

    const pinboardAppsyncUserTable = new db.Table(
      thisStack,
      pinboardUserTableBaseName,
      {
        billingMode: db.BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: "email",
          type: db.AttributeType.STRING,
        },
        encryption: db.TableEncryption.DEFAULT,
      }
    );

    const pinboardNotificationsLambdaBasename = "pinboard-notifications-lambda";

    const pinboardNotificationsLambda = new lambda.Function(
      thisStack,
      pinboardNotificationsLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(30),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.usersTableName]:
            pinboardAppsyncUserTable.tableName,
        },
        functionName: `${pinboardNotificationsLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${pinboardNotificationsLambdaBasename}/${pinboardNotificationsLambdaBasename}.zip`
        ),
        initialPolicy: [readPinboardParamStorePolicyStatement],
      }
    );
    pinboardAppsyncUserTable.grantReadData(pinboardNotificationsLambda);

    const pinboardAuthLambdaBasename = "pinboard-auth-lambda";

    const pinboardAuthLambda = new lambda.Function(
      thisStack,
      pinboardAuthLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(11),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
        },
        functionName: `${pinboardAuthLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${pinboardAuthLambdaBasename}/${pinboardAuthLambdaBasename}.zip`
        ),
        initialPolicy: [pandaConfigAndKeyPolicyStatement],
      }
    );

    const gqlSchema = appsync.Schema.fromAsset(
      join(__dirname, "../shared/graphql/schema.graphql")
    );

    const pinboardAppsyncApiBaseName = "pinboard-appsync-api";
    const pinboardAppsyncApi = new appsync.GraphqlApi(
      thisStack,
      pinboardAppsyncApiBaseName,
      {
        name: `${pinboardAppsyncApiBaseName}-${STAGE}`,
        schema: gqlSchema,
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.LAMBDA,
            lambdaAuthorizerConfig: {
              handler: pinboardAuthLambda,
              resultsCacheTtl: Duration.seconds(30),
            },
          },
        },
        xrayEnabled: true,
      }
    );

    const pinboardItemTableBaseName = "pinboard-item-table";

    const pinboardAppsyncItemTable = new db.Table(
      thisStack,
      pinboardItemTableBaseName,
      {
        billingMode: db.BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: "id",
          type: db.AttributeType.STRING,
        },
        sortKey: {
          name: "timestamp",
          type: db.AttributeType.NUMBER,
        },
        encryption: db.TableEncryption.DEFAULT,
        stream: db.StreamViewType.NEW_IMAGE,
      }
    );

    pinboardNotificationsLambda.addEventSource(
      new DynamoEventSource(pinboardAppsyncItemTable, {
        maxBatchingWindow: Duration.seconds(10),
        startingPosition: lambda.StartingPosition.LATEST,
      })
    );

    const pinboardLastItemSeenByUserTableBaseName =
      "pinboard-last-item-seen-by-user-table";

    const pinboardAppsyncLastItemSeenByUserTable = new db.Table(
      thisStack,
      pinboardLastItemSeenByUserTableBaseName,
      {
        billingMode: db.BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: "pinboardId",
          type: db.AttributeType.STRING,
        },
        sortKey: {
          name: "userEmail",
          type: db.AttributeType.STRING,
        },
        encryption: db.TableEncryption.DEFAULT,
      }
    );

    const pinboardWorkflowBridgeLambdaDataSource = pinboardAppsyncApi.addLambdaDataSource(
      `${workflowBridgeLambdaBasename
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_ds`,
      pinboardWorkflowBridgeLambda
    );

    const pinboardGridBridgeLambdaDataSource = pinboardAppsyncApi.addLambdaDataSource(
      `${gridBridgeLambdaBasename
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_ds`,
      pinboardGridBridgeLambda
    );

    const pinboardItemDataSource = pinboardAppsyncApi.addDynamoDbDataSource(
      `${pinboardItemTableBaseName
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_datasource`,
      pinboardAppsyncItemTable
    );

    const pinboardLastItemSeenByUserDataSource = pinboardAppsyncApi.addDynamoDbDataSource(
      `${pinboardLastItemSeenByUserTableBaseName
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_datasource`,
      pinboardAppsyncLastItemSeenByUserTable
    );

    const pinboardUserDataSource = pinboardAppsyncApi.addDynamoDbDataSource(
      `${pinboardUserTableBaseName
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_datasource`,
      pinboardAppsyncUserTable
    );

    const gqlSchemaChecksum = crypto
      .createHash("md5")
      .update(gqlSchema.definition, "utf8")
      .digest("hex");

    // workaround for resolvers sometimes getting disconnected
    // see https://github.com/aws/aws-appsync-community/issues/146
    const resolverBugWorkaround = (mappingTemplate: appsync.MappingTemplate) =>
      appsync.MappingTemplate.fromString(
        `## schema checksum : ${gqlSchemaChecksum}\n${mappingTemplate.renderTemplate()}`
      );

    const dynamoFilterRequestMappingTemplate = resolverBugWorkaround(
      appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Scan",
          "filter": #if($context.args.filter) $util.transform.toDynamoDBFilterExpression($ctx.args.filter) #else null #end,
        }
      `)
    );
    const dynamoFilterResponseMappingTemplate = appsync.MappingTemplate.fromString(
      "$util.toJson($context.result)"
    );

    pinboardItemDataSource.createResolver({
      typeName: "Query",
      fieldName: "listItems",
      requestMappingTemplate: dynamoFilterRequestMappingTemplate,
      responseMappingTemplate: dynamoFilterResponseMappingTemplate,
    });

    pinboardItemDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "createItem",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.dynamoDbPutItem(
          appsync.PrimaryKey.partition("id").auto(),
          appsync.Values.projecting("input")
            .attribute("timestamp")
            .is("$util.time.nowEpochSeconds()")
            .attribute("userEmail")
            .is("$ctx.identity.resolverContext.userEmail")
        )
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    pinboardLastItemSeenByUserDataSource.createResolver({
      typeName: "Query",
      fieldName: "listLastItemSeenByUsers",
      requestMappingTemplate: dynamoFilterRequestMappingTemplate, // TODO consider custom resolver for performance
      responseMappingTemplate: dynamoFilterResponseMappingTemplate,
    });

    pinboardLastItemSeenByUserDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "seenItem",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key" : {
            "pinboardId" : $util.dynamodb.toDynamoDBJson($ctx.args.input.pinboardId),
            "userEmail" : $util.dynamodb.toDynamoDBJson($ctx.identity.resolverContext.userEmail)
          },
          "update" : {
            "expression" : "SET seenAt = :seenAt, itemID = :itemID",
            "expressionValues": {
              ":seenAt" : $util.dynamodb.toDynamoDBJson($util.time.nowEpochSeconds()),
              ":itemID" : $util.dynamodb.toDynamoDBJson($ctx.args.input.itemID)
            }
          }
        }
      `)
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    ["listPinboards", "getPinboardByComposerId", "getPinboardsByIds"].forEach(
      (fieldName) =>
        pinboardWorkflowBridgeLambdaDataSource.createResolver({
          typeName: "Query",
          fieldName,
          responseMappingTemplate: resolverBugWorkaround(
            appsync.MappingTemplate.lambdaResult()
          ),
        })
    );

    ["getGridSearchSummary"].forEach((fieldName) =>
      pinboardGridBridgeLambdaDataSource.createResolver({
        typeName: "Query",
        fieldName,
        responseMappingTemplate: resolverBugWorkaround(
          appsync.MappingTemplate.lambdaResult()
        ),
      })
    );

    const removePushNotificationSecretsFromUserResponseMappingTemplate = appsync
      .MappingTemplate.fromString(`
        #set($output = $ctx.result)
        $util.qr($output.put("hasWebPushSubscription", $util.isMap($ctx.result.webPushSubscription)))
        $util.toJson($output)
    `);

    pinboardUserDataSource.createResolver({
      typeName: "Query",
      fieldName: "listUsers",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Scan",
          "filter": {
            "expression": "attribute_exists(#firstName) AND attribute_exists(#lastName)",
            "expressionNames": {
              "#firstName": "firstName",
              "#lastName": "lastName",
            },
          },
        }
      `)
      ),
      responseMappingTemplate: dynamoFilterResponseMappingTemplate,
    });

    pinboardUserDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "setWebPushSubscriptionForUser",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key" : {
            "email" : $util.dynamodb.toDynamoDBJson($ctx.identity.resolverContext.userEmail)
          },
          "update" : {
            "expression" : "SET webPushSubscription = :webPushSubscription",
            "expressionValues": {
              ":webPushSubscription" : $util.dynamodb.toDynamoDBJson($ctx.args.webPushSubscription)
            }
          }
        }
      `)
      ),
      responseMappingTemplate: removePushNotificationSecretsFromUserResponseMappingTemplate,
    });

    pinboardUserDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addManuallyOpenedPinboardIds",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key" : {
            "email" : $util.dynamodb.toDynamoDBJson(
              $util.defaultIfNull(
                $ctx.args.maybeEmailOverride,
                $ctx.identity.resolverContext.userEmail
              )
            )
          },
          "update" : {
            "expression" : "ADD manuallyOpenedPinboardIds :manuallyOpenedPinboardIds",
            "expressionValues": {
              ":manuallyOpenedPinboardIds" : $util.dynamodb.toStringSetJson($ctx.args.ids)
            }
          }
        }
      `)
      ),
      responseMappingTemplate: removePushNotificationSecretsFromUserResponseMappingTemplate,
    });

    pinboardUserDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "removeManuallyOpenedPinboardIds",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "UpdateItem",
          "key" : {
            "email" : $util.dynamodb.toDynamoDBJson($ctx.identity.resolverContext.userEmail)
          },
          "update" : {
            "expression" : "DELETE manuallyOpenedPinboardIds :manuallyOpenedPinboardIds",
            "expressionValues": {
              ":manuallyOpenedPinboardIds" : $util.dynamodb.toStringSetJson($ctx.args.ids)
            }
          }
        }
      `)
      ),
      responseMappingTemplate: removePushNotificationSecretsFromUserResponseMappingTemplate,
    });

    pinboardUserDataSource.createResolver({
      typeName: "Query",
      fieldName: "getMyUser",
      requestMappingTemplate: resolverBugWorkaround(
        appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "GetItem",
          "key" : {
            "email" : $util.dynamodb.toDynamoDBJson($ctx.identity.resolverContext.userEmail)
          }
        }
      `)
      ),
      responseMappingTemplate: removePushNotificationSecretsFromUserResponseMappingTemplate,
    });

    const usersRefresherLambdaBasename = "pinboard-users-refresher-lambda";

    const usersRefresherLambdaFunction = new lambda.Function(
      thisStack,
      usersRefresherLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.minutes(15),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.usersTableName]:
            pinboardAppsyncUserTable.tableName,
        },
        functionName: `${usersRefresherLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${usersRefresherLambdaBasename}/${usersRefresherLambdaBasename}.zip`
        ),
        initialPolicy: [
          permissionsFilePolicyStatement,
          pandaConfigAndKeyPolicyStatement,
        ],
      }
    );
    pinboardAppsyncUserTable.grantReadWriteData(usersRefresherLambdaFunction);

    new events.Rule(
      thisStack,
      `${usersRefresherLambdaBasename}-schedule-isProcessPermissionChangesOnly`,
      {
        description: `Runs the ${usersRefresherLambdaFunction.functionName} every minute, with 'isProcessPermissionChangesOnly: true'.`,
        enabled: true,
        targets: [
          new eventsTargets.LambdaFunction(usersRefresherLambdaFunction, {
            event: events.RuleTargetInput.fromObject({
              isProcessPermissionChangesOnly: true,
            }),
          }),
        ],
        schedule: events.Schedule.rate(Duration.minutes(1)),
      }
    );
    new events.Rule(
      thisStack,
      `${usersRefresherLambdaBasename}-schedule-FULL-RUN`,
      {
        description: `Runs the ${usersRefresherLambdaFunction.functionName} every 24 hours, which should be a FULL RUN.`,
        enabled: true,
        targets: [
          new eventsTargets.LambdaFunction(usersRefresherLambdaFunction),
        ],
        schedule: events.Schedule.rate(Duration.days(1)),
      }
    );

    const bootstrappingLambdaBasename = "pinboard-bootstrapping-lambda";
    const bootstrappingLambdaApiBaseName = `${bootstrappingLambdaBasename}-api`;

    const bootstrappingLambdaFunction = new lambda.Function(
      thisStack,
      bootstrappingLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.graphqlEndpoint]:
            pinboardAppsyncApi.graphqlUrl,
          [ENVIRONMENT_VARIABLE_KEYS.sentryDSN]: ssm.StringParameter.valueForStringParameter(
            this,
            "/pinboard/sentryDSN"
          ),
        },
        functionName: `${bootstrappingLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${bootstrappingLambdaApiBaseName}/${bootstrappingLambdaApiBaseName}.zip`
        ),
        initialPolicy: [
          pandaConfigAndKeyPolicyStatement,
          permissionsFilePolicyStatement,
        ],
      }
    );

    const bootstrappingApiGateway = new apiGateway.LambdaRestApi(
      thisStack,
      bootstrappingLambdaApiBaseName,
      {
        restApiName: `${bootstrappingLambdaApiBaseName}-${STAGE}`,
        handler: bootstrappingLambdaFunction,
        endpointTypes: [apiGateway.EndpointType.REGIONAL],
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["execute-api:Invoke"],
              resources: [`arn:aws:execute-api:${region}:*`],
              principals: [new iam.AnyPrincipal()],
            }),
          ],
        }),
        defaultMethodOptions: {
          apiKeyRequired: false,
        },
        deployOptions: {
          stageName: "api",
        },
        minimumCompressionSize: 0, // gzip responses where the client (i.e. browser) supports it (via 'Accept-Encoding' header)
      }
    );

    const MAPPING_KEY = "mapping";
    const DOMAIN_NAME_KEY = "DomainName";
    new CfnMapping(thisStack, MAPPING_KEY, {
      [MAPPING_KEY]: {
        [DOMAIN_NAME_KEY]: {
          CODE: "pinboard.code.dev-gutools.co.uk",
          PROD: "pinboard.gutools.co.uk",
        },
      },
    });

    const domainName = Fn.findInMap(MAPPING_KEY, DOMAIN_NAME_KEY, STAGE);

    const bootstrappingApiCertificate = new acm.Certificate(
      thisStack,
      `${bootstrappingLambdaApiBaseName}-certificate`,
      {
        domainName,
        validation: acm.CertificateValidation.fromDns(),
      }
    );

    const bootstrappingApiDomainName = new apiGateway.DomainName(
      thisStack,
      `${bootstrappingLambdaApiBaseName}-domain-name`,
      {
        domainName,
        certificate: bootstrappingApiCertificate,
        endpointType: apiGateway.EndpointType.REGIONAL,
      }
    );

    bootstrappingApiDomainName.addBasePathMapping(bootstrappingApiGateway, {
      basePath: "",
    });

    new CfnOutput(thisStack, `${bootstrappingLambdaApiBaseName}-hostname`, {
      description: `${bootstrappingLambdaApiBaseName}-hostname`,
      value: `${bootstrappingApiDomainName.domainNameAliasDomainName}`,
    });
  }
}
