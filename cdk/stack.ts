import {CfnParameter, Construct, Duration, IConstruct, Stack, StackProps, Tags} from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as S3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as apigateway from "@aws-cdk/aws-apigateway";

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

    function withStandardGuardianTags<SCOPE extends IConstruct>(scope: SCOPE) {
      Tags.of(scope).add("App", APP);
      Tags.of(scope).add("Stage", STAGE);
      Tags.of(scope).add("Stack", STACK);
      return scope;
    }

    const deployBucket = S3.Bucket.fromBucketName(
      thisStack,
      "composer-dist",
      "composer-dist"
    );

    const bootstrappingLambdaBasename = "pinboard-bootstrapping-lambda"
    const bootstrappingLambdaFunction = withStandardGuardianTags(
      new lambda.Function(thisStack, bootstrappingLambdaBasename, {
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
          `${STACK}/${STAGE}/${bootstrappingLambdaBasename}/${bootstrappingLambdaBasename}.zip`
        )
      })
    );

    const bootstrappingLambdaPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["execute-api:Invoke"],
      resources: ["*"] //TODO change this to point to the lambda
    });
    bootstrappingLambdaPolicyStatement.addAnyPrincipal();

    const bootstrappingApiGateway = new apigateway.LambdaRestApi(thisStack, `${bootstrappingLambdaBasename}-api`, {
      handler: bootstrappingLambdaFunction,
      endpointTypes: [apigateway.EndpointType.EDGE],
      policy: new iam.PolicyDocument({
        statements: [bootstrappingLambdaPolicyStatement]
      }),
      defaultMethodOptions: {
        apiKeyRequired: false
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