import {
  App,
  aws_apigateway as apiGateway,
  aws_autoscaling as autoscaling,
  aws_certificatemanager as acm,
  aws_cloudwatch as cloudwatch,
  aws_ec2 as ec2,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_rds as rds,
  aws_s3 as S3,
  aws_ssm as ssm,
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
} from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { join } from "path";
import {
  APP,
  DATABASE_BRIDGE_LAMBDA_BASENAME,
  getDatabaseBridgeLambdaFunctionName,
  getNotificationsLambdaFunctionName,
  getWorkflowBridgeLambdaFunctionName,
  NOTIFICATIONS_LAMBDA_BASENAME,
  WORKFLOW_BRIDGE_LAMBDA_BASENAME,
} from "../../shared/constants";
import crypto from "crypto";
import { ENVIRONMENT_VARIABLE_KEYS } from "../../shared/environmentVariables";
import {
  DATABASE_NAME,
  DATABASE_PORT,
  DATABASE_USERNAME,
  databaseJumpHostASGLogicalID,
  getDatabaseJumpHostAsgName,
  getDatabaseProxyName,
} from "../../shared/database/database";
import { Stage } from "../../shared/types/stage";
import { MUTATIONS, QUERIES } from "../../shared/graphql/operations";
import {
  GuAmiParameter,
  GuStack,
  GuStackProps,
} from "@guardian/cdk/lib/constructs/core";
import { GuVpc, SubnetType } from "@guardian/cdk/lib/constructs/ec2";
import {
  GuAutoScalingGroup,
  GuUserData,
} from "@guardian/cdk/lib/constructs/autoscaling";
import { GuAlarm } from "@guardian/cdk/lib/constructs/cloudwatch";
import { GuScheduledLambda } from "@guardian/cdk";

// if changing should also change .nvmrc (at the root of repo)
const LAMBDA_NODE_VERSION = lambda.Runtime.NODEJS_16_X;

interface PinBoardStackProps extends GuStackProps {
  domainName: string;
}

export class PinBoardStack extends GuStack {
  constructor(
    scope: App,
    id: string,
    { domainName, ...props }: PinBoardStackProps
  ) {
    super(scope, id, { ...props, app: APP });

    const context = Stack.of(this);
    const account = context.account;
    const region = context.region;

    const isPROD = this.stage === "PROD";

    const accountVpc = GuVpc.fromIdParameter(this, "AccountVPC", {
      availabilityZones: Fn.getAzs(region),
      privateSubnetIds: GuVpc.subnetsFromParameter(this, {
        app: APP,
        type: SubnetType.PRIVATE,
      }).map((subnet) => subnet.subnetId),
    });

    const database = new rds.DatabaseInstance(this, "Database", {
      instanceIdentifier: `${APP}-db-${this.stage}`,
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
        isPROD ? ec2.InstanceSize.SMALL : ec2.InstanceSize.MICRO
      ),
      multiAz: isPROD,
      publiclyAccessible: false,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const databaseProxy = database.addProxy("DatabaseProxy", {
      dbProxyName: getDatabaseProxyName(this.stage as Stage),
      vpc: accountVpc,
      secrets: [database.secret!],
      iamAuth: true,
      requireTLS: true,
    });
    const cfnDatabaseProxy = databaseProxy.node.defaultChild as rds.CfnDBProxy;

    const databaseHostname = databaseProxy.endpoint;

    const deployBucket = S3.Bucket.fromBucketName(
      this,
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
      resources: [`arn:aws:s3:::permissions-cache/${this.stage}/*`], //TODO when we guCDK the bootstrapping-lambda, tighten this up and use constants from 'shared/permissions.ts'
    });

    const pandaConfigAndKeyPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject"],
      resources: [`arn:aws:s3:::pan-domain-auth-settings/*`], //TODO when we guCDK the bootstrapping-lambda, tighten this up and use constants from 'shared/panDomainAuth.ts' (ideally we could limit to the stage specific settings file and anything in stage specific directory
    });

    const workflowDatastoreVpcId = Fn.importValue(
      `WorkflowDatastoreLoadBalancerSecurityGroupVpcId-${this.stage}`
    );

    const workflowDatastoreVPC = ec2.Vpc.fromVpcAttributes(
      this,
      "workflow-datastore-vpc",
      {
        vpcId: workflowDatastoreVpcId,
        availabilityZones: Fn.getAzs(region),
        privateSubnetIds: Fn.split(
          ",",
          Fn.importValue(`WorkflowPrivateSubnetIds-${this.stage}`)
        ),
      }
    );

    const pinboardWorkflowBridgeLambda = new lambda.Function(
      this,
      WORKFLOW_BRIDGE_LAMBDA_BASENAME,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.workflowDnsName]: Fn.importValue(
            `WorkflowDatastoreLoadBalancerDNSName-${this.stage}`
          ),
        },
        functionName: getWorkflowBridgeLambdaFunctionName(this.stage as Stage),
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${WORKFLOW_BRIDGE_LAMBDA_BASENAME}/${WORKFLOW_BRIDGE_LAMBDA_BASENAME}.zip`
        ),
        role: new iam.Role(this, `${WORKFLOW_BRIDGE_LAMBDA_BASENAME}-role`, {
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
            this,
            "workflow-datastore-load-balancer-security-group",
            Fn.importValue(
              `WorkflowDatastoreLoadBalancerSecurityGroupId-${this.stage}`
            )
          ),
        ],
      }
    );

    const gridBridgeLambdaBasename = "pinboard-grid-bridge-lambda";
    const pinboardGridBridgeLambda = new lambda.Function(
      this,
      gridBridgeLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
        },
        functionName: `${gridBridgeLambdaBasename}-${this.stage}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${gridBridgeLambdaBasename}/${gridBridgeLambdaBasename}.zip`
        ),
        initialPolicy: [readPinboardParamStorePolicyStatement],
      }
    );

    const databaseSecurityGroupName = `PinboardDatabaseSecurityGroup${this.stage}`;
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
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
      this,
      "databaseProxySecurityGroup",
      Fn.select(0, cfnDatabaseProxy!.vpcSecurityGroupIds!)
    ).addIngressRule(
      ec2.Peer.securityGroupId(databaseSecurityGroup.securityGroupId),
      ec2.Port.tcp(DATABASE_PORT),
      `Allow ${databaseSecurityGroupName} to connect to the ${databaseProxy.dbProxyName}`
    );

    const pinboardDatabaseBridgeLambda = new lambda.Function(
      this,
      DATABASE_BRIDGE_LAMBDA_BASENAME,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(30),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.databaseHostname]: databaseHostname,
        },
        functionName: getDatabaseBridgeLambdaFunctionName(this.stage as Stage),
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${DATABASE_BRIDGE_LAMBDA_BASENAME}/${DATABASE_BRIDGE_LAMBDA_BASENAME}.zip`
        ),
        initialPolicy: [],
        vpc: accountVpc,
        securityGroups: [databaseSecurityGroup],
      }
    );
    databaseProxy.grantConnect(pinboardDatabaseBridgeLambda);

    const databaseJumpHostASGName = getDatabaseJumpHostAsgName(
      this.stage as Stage
    );

    const databaseJumpHostASG = new GuAutoScalingGroup(
      this,
      databaseJumpHostASGLogicalID,
      {
        vpc: accountVpc,
        app: APP,
        autoScalingGroupName: databaseJumpHostASGName,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.NANO
        ),
        groupMetrics: [
          new autoscaling.GroupMetrics(
            autoscaling.GroupMetric.IN_SERVICE_INSTANCES
          ),
        ],
        allowAllOutbound: false,
        minimumInstances: 0,
        maximumInstances: 1,
        additionalSecurityGroups: [databaseSecurityGroup],
        imageId: new GuAmiParameter(this, { app: APP }),
        userData: new GuUserData(this, {
          app: APP,
          distributable: {
            fileName: "startup.sh",
            executionStatement: `bash /${APP}/startup.sh ${databaseJumpHostASGName} ${region}`,
          },
        }).userData,
      }
    );
    databaseProxy.grantConnect(databaseJumpHostASG);
    databaseJumpHostASG.addToRolePolicy(
      // allow the instance to effectively terminate itself by reducing the capacity of the ASG that controls it
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["autoscaling:SetDesiredCapacity"],
        resources: [
          `arn:aws:autoscaling:${region}:${account}:*/${databaseJumpHostASGName}`, // unfortunately can't use the databaseJumpHostASG.autoScalingGroupArn property as it's circular
        ],
      })
    );
    new GuAlarm(this, "DatabaseJumpHostOverrunningAlarm", {
      app: APP,
      snsTopicName: "Cloudwatch-Alerts",
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
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      threshold: 0,
      evaluationPeriods: 12,
      actionsEnabled: true,
      okAction: true,
    });

    const pinboardNotificationsLambda = new lambda.Function(
      this,
      NOTIFICATIONS_LAMBDA_BASENAME,
      {
        vpc: accountVpc,
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(30),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
        },
        functionName: getNotificationsLambdaFunctionName(this.stage as Stage),
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${NOTIFICATIONS_LAMBDA_BASENAME}/${NOTIFICATIONS_LAMBDA_BASENAME}.zip`
        ),
        initialPolicy: [readPinboardParamStorePolicyStatement],
      }
    );
    const notificationLambdaInvokeRole = new iam.Role(
      this,
      "NotificationLambdaInvokeRole",
      {
        assumedBy: new iam.ServicePrincipal("rds.amazonaws.com"),
        roleName: `${APP}-${pinboardNotificationsLambda.functionName}-database-invoke-${this.stage}`,
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
      this,
      pinboardAuthLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(11),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
        },
        functionName: `${pinboardAuthLambdaBasename}-${this.stage}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${pinboardAuthLambdaBasename}/${pinboardAuthLambdaBasename}.zip`
        ),
        initialPolicy: [pandaConfigAndKeyPolicyStatement],
      }
    );

    const gqlSchema = appsync.Schema.fromAsset(
      join(__dirname, "../../shared/graphql/schema.graphql")
    );

    const pinboardAppsyncApiBaseName = "pinboard-appsync-api";
    const pinboardAppsyncApi = new appsync.GraphqlApi(
      this,
      pinboardAppsyncApiBaseName,
      {
        name: `${pinboardAppsyncApiBaseName}-${this.stage}`,
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
      `${WORKFLOW_BRIDGE_LAMBDA_BASENAME.replace("pinboard-", "")
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
      this,
      usersRefresherLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 512,
        timeout: Duration.minutes(15),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.databaseHostname]: databaseHostname,
        },
        functionName: `${usersRefresherLambdaBasename}-${this.stage}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${usersRefresherLambdaBasename}/${usersRefresherLambdaBasename}.zip`
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
      this,
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
    new events.Rule(this, `${usersRefresherLambdaBasename}-schedule-FULL-RUN`, {
      description: `Runs the ${usersRefresherLambdaFunction.functionName} every 24 hours, which should be a FULL RUN.`,
      enabled: true,
      targets: [new eventsTargets.LambdaFunction(usersRefresherLambdaFunction)],
      schedule: events.Schedule.rate(Duration.days(1)),
    });

    const archiverLambda = new GuScheduledLambda(this, "ArchiverLambda", {
      app: APP,
      vpc: accountVpc,
      securityGroups: [databaseSecurityGroup],
      functionName: `pinboard-archiver-lambda-${this.stage}`,
      runtime: LAMBDA_NODE_VERSION,
      handler: "index.handler",
      environment: {
        [ENVIRONMENT_VARIABLE_KEYS.databaseHostname]: databaseHostname,
      },
      monitoringConfiguration: {
        noMonitoring: true,
        // toleratedErrorPercentage: 0 TODO consider alarming on errors (need to provide sns topic which is sad since GuAlarm finds it for you)
      },
      fileName: "pinboard-archiver-lambda.zip",
      rules: [
        {
          schedule: events.Schedule.rate(Duration.hours(6)),
          description:
            "Run every 6 hours to ensure pinboards get cleaned out regularly",
        },
      ],
    });
    pinboardWorkflowBridgeLambda.grantInvoke(archiverLambda);
    databaseProxy.grantConnect(archiverLambda);

    const bootstrappingLambdaBasename = "pinboard-bootstrapping-lambda";
    const bootstrappingLambdaApiBaseName = `${bootstrappingLambdaBasename}-api`;

    const bootstrappingLambdaFunction = new lambda.Function(
      this,
      bootstrappingLambdaBasename,
      {
        runtime: LAMBDA_NODE_VERSION,
        memorySize: 128,
        timeout: Duration.seconds(5),
        handler: "index.handler",
        environment: {
          STAGE: this.stage,
          STACK: this.stack,
          APP,
          [ENVIRONMENT_VARIABLE_KEYS.graphqlEndpoint]:
            pinboardAppsyncApi.graphqlUrl,
          [ENVIRONMENT_VARIABLE_KEYS.sentryDSN]: ssm.StringParameter.valueForStringParameter(
            this,
            "/pinboard/sentryDSN"
          ),
        },
        functionName: `${bootstrappingLambdaBasename}-${this.stage}`,
        code: lambda.Code.fromBucket(
          deployBucket,
          `${this.stack}/${this.stage}/${bootstrappingLambdaApiBaseName}/${bootstrappingLambdaApiBaseName}.zip`
        ),
        initialPolicy: [
          pandaConfigAndKeyPolicyStatement,
          permissionsFilePolicyStatement,
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["lambda:InvokeFunction"],
            resources: [
              `arn:aws:lambda:${region}:${account}:function:${DATABASE_BRIDGE_LAMBDA_BASENAME}-${
                isPROD ? "*" : this.stage
              }`,
            ],
          }),
        ],
      }
    );

    const bootstrappingApiGateway = new apiGateway.LambdaRestApi(
      this,
      bootstrappingLambdaApiBaseName,
      {
        restApiName: `${bootstrappingLambdaApiBaseName}-${this.stage}`,
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

    const bootstrappingApiCertificate = new acm.Certificate(
      this,
      `${bootstrappingLambdaApiBaseName}-certificate`,
      {
        domainName,
        validation: acm.CertificateValidation.fromDns(),
      }
    );

    const bootstrappingApiDomainName = new apiGateway.DomainName(
      this,
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

    new CfnOutput(this, `${bootstrappingLambdaApiBaseName}-hostname`, {
      description: `${bootstrappingLambdaApiBaseName}-hostname`,
      value: `${bootstrappingApiDomainName.domainNameAliasDomainName}`,
    });
  }
}
