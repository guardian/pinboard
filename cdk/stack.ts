import {
  App,
  aws_apigateway as apiGateway,
  aws_autoscaling as autoscaling,
  aws_certificatemanager as acm,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cloudwatchActions,
  aws_ec2 as ec2,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_rds as rds,
  aws_s3 as S3,
  aws_sns as sns,
  aws_ssm as ssm,
  CfnMapping,
  CfnOutput,
  CfnParameter,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps,
  Tags,
} from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { join } from "path";
import {
  APP,
  DATABASE_BRIDGE_LAMBDA_BASENAME,
  getDatabaseBridgeLambdaFunctionName,
  getNotificationsLambdaFunctionName,
  NOTIFICATIONS_LAMBDA_BASENAME,
} from "../shared/constants";
import crypto from "crypto";
import { ENVIRONMENT_VARIABLE_KEYS } from "../shared/environmentVariables";
import {
  DATABASE_NAME,
  DATABASE_PORT,
  DATABASE_USERNAME,
  databaseJumpHostASGLogicalID,
  getDatabaseJumpHostAsgName,
  getDatabaseProxyName,
} from "../shared/database/database";
import { Stage } from "../shared/types/stage";
import { OperatingSystemType } from "aws-cdk-lib/aws-ec2";
import * as fs from "fs";
import { MUTATIONS, QUERIES } from "../shared/graphql/operations";

export class PinBoardStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const thisStack = this;

    const context = Stack.of(this);
    const account = context.account;
    const region = context.region;

    // if changing should also change .nvmrc (at the root of repo)
    const LAMBDA_NODE_VERSION = lambda.Runtime.NODEJS_16_X;

    const STACK = new CfnParameter(thisStack, "Stack", {
      type: "String",
      description: "Stack",
    }).valueAsString;

    const STAGE = new CfnParameter(thisStack, "Stage", {
      type: "String",
      description: "Stage",
    }).valueAsString;

    const DatabaseJumpHostAmiID = new CfnParameter(
      thisStack,
      "DatabaseJumpHostAmiID",
      {
        type: "AWS::EC2::Image::Id",
        description: "AMI ID to be used for database 'jump host'",
      }
    ).valueAsString;

    Tags.of(thisStack).add("App", APP);
    Tags.of(thisStack).add("Stage", STAGE);
    Tags.of(thisStack).add("Stack", STACK);

    const accountVpcPrivateSubnetIds = new CfnParameter(
      thisStack,
      "AccountVpcPrivateSubnetIds",
      {
        type: "AWS::SSM::Parameter::Value<List<String>>",
        description:
          "CFN param to retrieve value from Param Store - workaround for https://github.com/aws/aws-cdk/issues/19349",
        default: "/account/vpc/primary/subnets/private",
      }
    ).valueAsList;

    const accountVpc = ec2.Vpc.fromVpcAttributes(thisStack, "AccountVPC", {
      vpcId: ssm.StringParameter.valueForStringParameter(
        thisStack,
        "/account/vpc/primary/id"
      ),
      availabilityZones: Fn.getAzs(region),
      privateSubnetIds: accountVpcPrivateSubnetIds,
    });

    const database = new rds.DatabaseInstance(this, "Database", {
      instanceIdentifier: `${APP}-db-${STAGE}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_7, // RDS Proxy fails to create with a Postgres 14 instance (comment on 22 Aug 2022)
      }),
      vpc: accountVpc,
      port: DATABASE_PORT,
      databaseName: DATABASE_NAME,
      credentials: rds.Credentials.fromGeneratedSecret(DATABASE_USERNAME),
      iamAuthentication: true,
      storageType: rds.StorageType.GP2, // SSD
      allocatedStorage: 20, // minimum for GP2
      storageEncrypted: true,
      autoMinorVersionUpgrade: true,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO // TODO consider small for PROD
      ),
      multiAz: false, // TODO consider turning on for PROD
      publiclyAccessible: false,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const databaseProxy = database.addProxy("DatabaseProxy", {
      dbProxyName: getDatabaseProxyName(STAGE as Stage),
      vpc: accountVpc,
      secrets: [database.secret!],
      iamAuth: true,
      requireTLS: true,
    });
    const cfnDatabaseProxy = databaseProxy.node.defaultChild as rds.CfnDBProxy;

    const databaseHostname = databaseProxy.endpoint;

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
        timeout: Duration.seconds(6),
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

    const databaseSecurityGroupName = `PinboardDatabaseSecurityGroup${STAGE}`;
    const databaseSecurityGroup = new ec2.SecurityGroup(
      thisStack,
      "DatabaseSecurityGroup",
      {
        vpc: accountVpc,
        allowAllOutbound: true,
        securityGroupName: databaseSecurityGroupName,
      }
    );
    databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4("77.91.248.0/21"),
      ec2.Port.tcp(22),
      "Allow SSH for tunneling purposes when this security group is reused for database jump host."
    );
    ec2.SecurityGroup.fromSecurityGroupId(
      thisStack,
      "databaseProxySecurityGroup",
      Fn.select(0, cfnDatabaseProxy!.vpcSecurityGroupIds!)
    ).addIngressRule(
      ec2.Peer.securityGroupId(databaseSecurityGroup.securityGroupId),
      ec2.Port.tcp(DATABASE_PORT),
      `Allow ${databaseSecurityGroupName} to connect to the ${databaseProxy.dbProxyName}`
    );

    const pinboardDatabaseBridgeLambda = new lambda.Function(
      thisStack,
      DATABASE_BRIDGE_LAMBDA_BASENAME,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(30),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.databaseHostname]: databaseHostname,
        },
        functionName: getDatabaseBridgeLambdaFunctionName(STAGE as Stage),
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${DATABASE_BRIDGE_LAMBDA_BASENAME}/${DATABASE_BRIDGE_LAMBDA_BASENAME}.zip`
        ),
        initialPolicy: [],
        vpc: accountVpc,
        securityGroups: [databaseSecurityGroup],
      }
    );
    databaseProxy.grantConnect(pinboardDatabaseBridgeLambda);

    const databaseJumpHostASGName = getDatabaseJumpHostAsgName(STAGE as Stage);

    const selfTerminatingUserDataScript = ec2.UserData.custom(
      fs
        .readFileSync("./UserData.sh")
        .toString()
        .replace("${databaseJumpHostASGName}", databaseJumpHostASGName)
        .replace("${region}", region)
    );

    const databaseJumpHostASG = new autoscaling.AutoScalingGroup(
      thisStack,
      databaseJumpHostASGLogicalID,
      {
        autoScalingGroupName: databaseJumpHostASGName,
        vpc: accountVpc,
        allowAllOutbound: false,
        groupMetrics: [
          new autoscaling.GroupMetrics(
            autoscaling.GroupMetric.IN_SERVICE_INSTANCES
          ),
        ],
        machineImage: {
          getImage: () => ({
            imageId: DatabaseJumpHostAmiID,
            osType: OperatingSystemType.LINUX,
            userData: selfTerminatingUserDataScript,
          }),
        },
        role: new iam.Role(thisStack, "DatabaseJumpHostRole", {
          assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
          managedPolicies: [
            iam.ManagedPolicy.fromManagedPolicyArn(
              thisStack,
              "SSMPolicy",
              Fn.importValue("guardian-ec2-for-ssm-GuardianEC2ForSSMPolicy")
            ),
          ],
        }),
        securityGroup: databaseSecurityGroup,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.NANO
        ),
        minCapacity: 0,
        maxCapacity: 1,
        userData: selfTerminatingUserDataScript,
      }
    );
    databaseProxy.grantConnect(databaseJumpHostASG);

    // allow the instance to effectively terminate itself by reducing the capacity of the ASG that controls it
    databaseJumpHostASG.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["autoscaling:SetDesiredCapacity"],
        resources: [
          `arn:aws:autoscaling:${region}:${account}:*${databaseJumpHostASGName}`,
        ],
      })
    );

    const alarmsSnsTopic = sns.Topic.fromTopicArn(
      this,
      "CloudwatchAlertsSNS",
      `arn:aws:sns:${region}:${account}:Cloudwatch-Alerts`
    );

    const databaseJumpHostOverunningAlarm = new cloudwatch.Alarm(
      thisStack,
      "DatabaseJumpHostOverunningAlarm",
      {
        alarmName: `${databaseJumpHostASG.autoScalingGroupName} instance running for more than 12 hours`,
        alarmDescription: `The ${APP} database 'jump host' should not run for more than 12 hours as it suggests the mechanism to shut it down when it's idle looks to be broken`,
        metric: new cloudwatch.Metric({
          metricName: "GroupInServiceInstances",
          namespace: "AWS/AutoScaling",
          dimensionsMap: {
            AutoScalingGroupName: databaseJumpHostASG.autoScalingGroupName,
          },
          period: Duration.hours(1),
        }),
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: 0,
        evaluationPeriods: 12,
      }
    );
    databaseJumpHostOverunningAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmsSnsTopic)
    );
    databaseJumpHostOverunningAlarm.addOkAction(
      new cloudwatchActions.SnsAction(alarmsSnsTopic)
    );

    const pinboardNotificationsLambda = new lambda.Function(
      thisStack,
      NOTIFICATIONS_LAMBDA_BASENAME,
      {
        vpc: accountVpc,
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(30),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
        },
        functionName: getNotificationsLambdaFunctionName(STAGE as Stage),
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${NOTIFICATIONS_LAMBDA_BASENAME}/${NOTIFICATIONS_LAMBDA_BASENAME}.zip`
        ),
        initialPolicy: [readPinboardParamStorePolicyStatement],
      }
    );
    const notificationLambdaInvokeRole = new iam.Role(
      thisStack,
      "NotificationLambdaInvokeRole",
      {
        assumedBy: new iam.ServicePrincipal("rds.amazonaws.com"),
        roleName: `${APP}-${pinboardNotificationsLambda.functionName}-database-invoke-${STAGE}`,
        description: `Give ${APP} RDS Postgres instance permission to invoke ${pinboardNotificationsLambda.functionName}`,
      }
    );

    pinboardNotificationsLambda.grantInvoke(notificationLambdaInvokeRole);
    (database.node.defaultChild as rds.CfnDBInstance).associatedRoles = [
      {
        featureName: "Lambda",
        roleArn: notificationLambdaInvokeRole.roleArn,
      },
    ];

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

    const pinboardDatabaseBridgeLambdaDataSource = pinboardAppsyncApi.addLambdaDataSource(
      `${DATABASE_BRIDGE_LAMBDA_BASENAME.replace("pinboard-", "")
        .split("-")
        .join("_")}_ds`,
      pinboardDatabaseBridgeLambda
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

    const createLambdaResolver = (
      lambdaDS: appsync.LambdaDataSource,
      typeName: "Query" | "Mutation"
    ) => (fieldName: string) => {
      lambdaDS.createResolver({
        typeName,
        fieldName,
        responseMappingTemplate: resolverBugWorkaround(
          appsync.MappingTemplate.lambdaResult()
        ),
      });
    };

    QUERIES.database.forEach(
      createLambdaResolver(pinboardDatabaseBridgeLambdaDataSource, "Query")
    );
    MUTATIONS.database.forEach(
      createLambdaResolver(pinboardDatabaseBridgeLambdaDataSource, "Mutation")
    );

    QUERIES.workflow.forEach(
      createLambdaResolver(pinboardWorkflowBridgeLambdaDataSource, "Query")
    );

    QUERIES.grid.forEach(
      createLambdaResolver(pinboardGridBridgeLambdaDataSource, "Query")
    );

    const usersRefresherLambdaBasename = "pinboard-users-refresher-lambda";

    const usersRefresherLambdaFunction = new lambda.Function(
      thisStack,
      usersRefresherLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 512,
        timeout: Duration.minutes(15),
        handler: "index.handler",
        environment: {
          STAGE,
          STACK,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.databaseHostname]: databaseHostname,
        },
        functionName: `${usersRefresherLambdaBasename}-${STAGE}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${STACK}/${STAGE}/${usersRefresherLambdaBasename}/${usersRefresherLambdaBasename}.zip`
        ),
        initialPolicy: [
          permissionsFilePolicyStatement,
          readPinboardParamStorePolicyStatement,
        ],
        vpc: accountVpc,
        securityGroups: [databaseSecurityGroup],
      }
    );
    databaseProxy.grantConnect(usersRefresherLambdaFunction);

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
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["lambda:InvokeFunction"],
            resources: [
              `arn:aws:lambda:${region}:${account}:function:${DATABASE_BRIDGE_LAMBDA_BASENAME}-${
                STAGE === "PROD" ? "*" : STAGE
              }`,
            ],
          }),
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
