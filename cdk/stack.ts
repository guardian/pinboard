import {CfnMapping, CfnOutput, CfnParameter, Construct, Duration, Fn, Stack, StackProps, Tags} from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as S3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as appsync from "@aws-cdk/aws-appsync";
import * as db from "@aws-cdk/aws-dynamodb";
import * as acm from "@aws-cdk/aws-certificatemanager";
import { join } from "path";

export class PinBoardStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const thisStack = this;

    const APP = "pinboard"

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

    const pinboardAppsyncApiBaseName = "pinboard-appsync-api";
    const pinboardAppsyncApi = new appsync.GraphqlApi(thisStack, pinboardAppsyncApiBaseName, {
        name: `${pinboardAppsyncApiBaseName}-${STAGE}`,
        schema: appsync.Schema.fromAsset(join(__dirname, "schema.graphql")),
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.API_KEY,
          },
        },
        xrayEnabled: true,
      }
    );

    const pinboardAppsyncItemTable = new db.Table(thisStack, `pinboard-appsync-item-table`, {
      partitionKey: {
        name: "id",
        type: db.AttributeType.STRING,
      },
    });

    const pinboardItemDataSource = pinboardAppsyncApi.addDynamoDbDataSource(
      `pinboarditemdatasource`,
      pinboardAppsyncItemTable,
    );

    pinboardItemDataSource.createResolver({
      typeName: "Query",
      fieldName: "listItems",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
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
        appsync.Values.projecting("Item")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    // TODO: add resolvers for updates and deletes


    const deployBucket = S3.Bucket.fromBucketName(
      thisStack,
      "composer-dist",
      "composer-dist"
    );

    // this allows the lambda to query/create AppSync config/secrets
    const bootstrappingLambdaAppSyncPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["appsync:*"],
      resources: ["arn:aws:appsync:eu-west-1:*"] //TODO tighten up if possible
    });

    const bootstrappingLambdaBasename = "pinboard-bootstrapping-lambda"
    const bootstrappingLambdaFunction = new lambda.Function(thisStack, bootstrappingLambdaBasename, {
      runtime: lambda.Runtime.NODEJS_12_X, // if changing should also change .nvmrc (at the root of repo)
      memorySize: 128,
      timeout: Duration.seconds(5),
      handler: "index.handler",
      environment: {
        STAGE,
        STACK,
        APP
      },
      functionName: `${bootstrappingLambdaBasename}-${STAGE}`,
      code: lambda.Code.fromBucket(
        deployBucket,
        `pinboard/${STAGE}/${bootstrappingLambdaBasename}/${bootstrappingLambdaBasename}.zip`
      ),
      initialPolicy: [ bootstrappingLambdaAppSyncPolicyStatement ]
    });

    const bootstrappingLambdaExecutePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["execute-api:Invoke"],
      resources: ["arn:aws:execute-api:eu-west-1:*"] //TODO tighten up if possible
    });
    bootstrappingLambdaExecutePolicyStatement.addAnyPrincipal();

    const bootstrappingApiGateway = new apigateway.LambdaRestApi(thisStack, `${bootstrappingLambdaBasename}-api`, {
      restApiName: `${bootstrappingLambdaBasename}-api-${STAGE}`,
      handler: bootstrappingLambdaFunction,
      endpointTypes: [apigateway.EndpointType.EDGE],
      policy: new iam.PolicyDocument({
        statements: [ bootstrappingLambdaExecutePolicyStatement ]
      }),
      defaultMethodOptions: {
        apiKeyRequired: false
      },
      deployOptions: {
        stageName: "api"
      }
    });

    const MAPPING_KEY = "mapping";
    const DOMAIN_NAME_KEY = "DomainName";
    new CfnMapping(thisStack, MAPPING_KEY, {
      [MAPPING_KEY]: {
        [DOMAIN_NAME_KEY]: {
          CODE: "pinboard.code.dev-gutools.co.uk",
          PROD: "pinboard.gutools.co.uk"
        }
      }
    });

    const domainName = Fn.findInMap(MAPPING_KEY, DOMAIN_NAME_KEY, STAGE);

    const bootstrappingApiCertificate = new acm.Certificate(thisStack, `${bootstrappingLambdaBasename}-api-certificate`, {
      domainName,
      validationMethod: acm.ValidationMethod.DNS
    });

    const bootstrappingApiDomainName = new apigateway.DomainName(thisStack, `${bootstrappingLambdaBasename}-api-domain-name`, {
      domainName,
      certificate: bootstrappingApiCertificate,
      endpointType: apigateway.EndpointType.EDGE,
    });

    bootstrappingApiDomainName.addBasePathMapping(bootstrappingApiGateway, { basePath: "" });

    new CfnOutput(thisStack, `${bootstrappingLambdaBasename}-hostname`, {
      description: "hostname",
      value: `${bootstrappingApiDomainName.domainNameAliasDomainName}`,
    });

  }
}