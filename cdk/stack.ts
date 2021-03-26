import {
  CfnMapping,
  CfnOutput,
  CfnParameter,
  Construct,
  Duration,
  Fn,
  Stack,
  StackProps,
  Tags,
} from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as S3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as appsync from "@aws-cdk/aws-appsync";
import * as db from "@aws-cdk/aws-dynamodb";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";
import { join } from "path";
import { AWS_REGION } from "../shared/awsRegion";

export class PinBoardStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisStack = this;

    const APP = "pinboard";

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

    const deployBucket = S3.Bucket.fromBucketName(
      thisStack,
      "workflow-dist",
      "workflow-dist"
    );

    const workflowBridgeLambdaBasename = "pinboard-workflow-bridge-lambda";

    const vpcId = Fn.importValue(
      `WorkflowDatastoreLoadBalancerSecurityGroupVpcId-${STAGE}`
    );

    const workflowDatastoreVPC = ec2.Vpc.fromVpcAttributes(
      thisStack,
      "workflow-datastore-vpc",
      {
        vpcId: vpcId,
        availabilityZones: Fn.getAzs(AWS_REGION),
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
          WORKFLOW_DATASTORE_LOAD_BALANCER_DNS_NAME: Fn.importValue(
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

    const pinboardAppsyncApiBaseName = "pinboard-appsync-api";
    const pinboardAppsyncApi = new appsync.GraphqlApi(
      thisStack,
      pinboardAppsyncApiBaseName,
      {
        name: `${pinboardAppsyncApiBaseName}-${STAGE}`,
        schema: appsync.Schema.fromAsset(
          join(__dirname, "../shared/graphql/schema.graphql")
        ),
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.API_KEY,
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
      }
    );

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

    const pinboardWorkflowBridgeLambdaDataSource = pinboardAppsyncApi.addLambdaDataSource(
      `${workflowBridgeLambdaBasename
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_ds`,
      pinboardWorkflowBridgeLambda
    );

    const pinboardItemDataSource = pinboardAppsyncApi.addDynamoDbDataSource(
      `${pinboardItemTableBaseName
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_datasource`,
      pinboardAppsyncItemTable
    );

    const pinboardUserDataSource = pinboardAppsyncApi.addDynamoDbDataSource(
      `${pinboardUserTableBaseName
        .replace("pinboard-", "")
        .split("-")
        .join("_")}_datasource`,
      pinboardAppsyncUserTable
    );

    const dynamoFilterRequestMappingTemplate = appsync.MappingTemplate
      .fromString(`
        {
          "version": "2017-02-28",
          "operation": "Scan",
          "filter": #if($context.args.filter) $util.transform.toDynamoDBFilterExpression($ctx.args.filter) #else null #end,
        }
      `);
    const dynamoFilterRepsonseMappingTemplate = appsync.MappingTemplate.fromString(
      "$util.toJson($context.result)"
    );

    pinboardItemDataSource.createResolver({
      typeName: "Query",
      fieldName: "listItems",
      requestMappingTemplate: dynamoFilterRequestMappingTemplate,
      responseMappingTemplate: dynamoFilterRepsonseMappingTemplate,
    });

    pinboardItemDataSource.createResolver({
      typeName: "Query",
      fieldName: "getItem",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        "id",
        "id"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    pinboardItemDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "createItem",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition("id").auto(),
        appsync.Values.projecting("input")
          .attribute("timestamp")
          .is("$util.time.nowEpochSeconds()")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    // TODO: add resolvers for updates and deletes to dynamo

    pinboardWorkflowBridgeLambdaDataSource.createResolver({
      typeName: "Query",
      fieldName: "listPinboards",
    });

    pinboardWorkflowBridgeLambdaDataSource.createResolver({
      typeName: "Query",
      fieldName: "getPinboardByComposerId",
    });

    pinboardUserDataSource.createResolver({
      typeName: "Query",
      fieldName: "searchUsers",
      requestMappingTemplate: dynamoFilterRequestMappingTemplate,
      responseMappingTemplate: dynamoFilterRepsonseMappingTemplate,
    });

    pinboardUserDataSource.createResolver({
      typeName: "Query",
      fieldName: "getUser",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        "email",
        "email"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
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
          USERS_TABLE_NAME: pinboardAppsyncUserTable.tableName,
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

    const usersRefresherLambdaSchedule = new events.Rule(
      thisStack,
      `${usersRefresherLambdaBasename}-schedule`,
      {
        description: `Runs the ${usersRefresherLambdaFunction.functionName} every 6 hours.`,
        enabled: true,
        targets: [
          new eventsTargets.LambdaFunction(usersRefresherLambdaFunction),
        ],
        schedule: events.Schedule.rate(Duration.hours(6)),
      }
    );

    // this allows the lambda to query/create AppSync config/secrets
    const bootstrappingLambdaAppSyncPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["appsync:*"],
      resources: ["arn:aws:appsync:eu-west-1:*"], //TODO tighten up if possible
    });

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
        },
        functionName: `${bootstrappingLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${bootstrappingLambdaApiBaseName}/${bootstrappingLambdaApiBaseName}.zip`
        ),
        initialPolicy: [
          bootstrappingLambdaAppSyncPolicyStatement,
          permissionsFilePolicyStatement,
        ],
      }
    );

    const bootstrappingApiGateway = new apigateway.LambdaRestApi(
      thisStack,
      bootstrappingLambdaApiBaseName,
      {
        restApiName: `${bootstrappingLambdaApiBaseName}-${STAGE}`,
        handler: bootstrappingLambdaFunction,
        endpointTypes: [apigateway.EndpointType.REGIONAL],
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["execute-api:Invoke"],
              resources: [`arn:aws:execute-api:${AWS_REGION}:*`],
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
        validationMethod: acm.ValidationMethod.DNS,
      }
    );

    const bootstrappingApiDomainName = new apigateway.DomainName(
      thisStack,
      `${bootstrappingLambdaApiBaseName}-domain-name`,
      {
        domainName,
        certificate: bootstrappingApiCertificate,
        endpointType: apigateway.EndpointType.REGIONAL,
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
