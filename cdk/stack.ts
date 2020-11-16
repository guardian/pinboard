import {CfnParameter, Construct, Duration, IConstruct, Stack, StackProps, Tags} from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as S3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as appsync from "@aws-cdk/aws-appsync";
import * as db from "@aws-cdk/aws-dynamodb";
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
      )
    });

    const bootstrappingLambdaExecutePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["execute-api:Invoke"],
      resources: ["arn:aws:execute-api:eu-west-1:*"] //TODO tighten up if possible
    });
    bootstrappingLambdaExecutePolicyStatement.addAnyPrincipal();

    const bootstrappingLambdaAppSyncPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["appsync:*"],
      resources: [pinboardAppsyncApi.arn]
    });
    bootstrappingLambdaAppSyncPolicyStatement.addAnyPrincipal();

    const bootstrappingApiGateway = new apigateway.LambdaRestApi(thisStack, `${bootstrappingLambdaBasename}-api-${STAGE}`, {
      handler: bootstrappingLambdaFunction,
      endpointTypes: [apigateway.EndpointType.EDGE],
      policy: new iam.PolicyDocument({
        statements: [
          bootstrappingLambdaExecutePolicyStatement,
          bootstrappingLambdaAppSyncPolicyStatement
        ]
      }),
      defaultMethodOptions: {
        apiKeyRequired: false
      },
      deployOptions: {
        stageName: STAGE
      }
    });

    // TODO add certificate etc. e.g...
    // const telemetryCertificate = acm.Certificate.fromCertificateArn(
    //   this,
    //   "user-telemetry-certificate",
    //   telemetryCertificateArn.valueAsString
    // );
    // const telemetryCertificate = acm.Certificate.fromCertificateArn(
    //   this,
    //   "user-telemetry-certificate",
    //   telemetryCertificateArn.valueAsString
    // );
    //
    // const telemetryDomainName = new apigateway.DomainName(
    //   this,
    //   "user-telemetry-domain-name",
    //   {
    //     domainName: telemetryHostName.valueAsString,
    //     certificate: telemetryCertificate,
    //     endpointType: apigateway.EndpointType.EDGE,
    //   }
    // );
    //
    // telemetryDomainName.addBasePathMapping(telemetryApi, { basePath: "" });
    //
    // new CfnOutput(this, "user-telemetry-api-target-hostname", {
    //   description: "hostname",
    //   value: `${telemetryDomainName.domainNameAliasDomainName}`,
    // });

  }
}