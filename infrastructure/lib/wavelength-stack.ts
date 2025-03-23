import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as path from 'path';
import { Construct } from 'constructs';

export class WavelengthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'WavelengthUserPool', {
      userPoolName: 'wavelength-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'WavelengthUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          implicitCodeGrant: true,
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: ['http://localhost:3000/api/auth/callback/cognito'],
      },
    });

    // DynamoDB Tables
    const roomsTable = new dynamodb.Table(this, 'RoomsTable', {
      tableName: 'wavelength-rooms',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    const messagesTable = new dynamodb.Table(this, 'MessagesTable', {
      tableName: 'wavelength-messages',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Create GSI for messages by roomId
    messagesTable.addGlobalSecondaryIndex({
      indexName: 'byRoom',
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // AppSync API
    const api = new appsync.GraphqlApi(this, 'WavelengthAPI', {
      name: 'wavelength-api',
      schema: appsync.SchemaFile.fromAsset(path.join(__dirname, '../../src/graphql/schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
    });

    // DynamoDB Data Sources and Resolvers
    const roomsDS = api.addDynamoDbDataSource('RoomsDataSource', roomsTable);
    const messagesDS = api.addDynamoDbDataSource('MessagesDataSource', messagesTable);

    // Grant AppSync permissions to access DynamoDB
    roomsTable.grantReadWriteData(roomsDS);
    messagesTable.grantReadWriteData(messagesDS);

    // Add resolvers for the AppSync API
    roomsDS.createResolver('QueryGetRoomsByInterests', {
      typeName: 'Query',
      fieldName: 'getRoomsByInterests',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #set($interests = $ctx.args.interests)
        {
          "version": "2018-05-29",
          "operation": "Scan",
          "filter": {
            "expression": "contains(interests, :interest)",
            "expressionValues": {
              ":interest": $util.dynamodb.toDynamoDBJson($interests[0])
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    roomsDS.createResolver('QueryGetActiveRooms', {
      typeName: 'Query',
      fieldName: 'getActiveRooms',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2018-05-29",
          "operation": "Scan",
          "filter": {
            "expression": "expiresAt > :now",
            "expressionValues": {
              ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
            }
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'WavelengthPipeline', {
      pipelineName: 'wavelength-pipeline',
      crossAccountKeys: false,
    });

    // Source Stage
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'shmurthy08',
      repo: 'wavelength',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput,
      branch: 'main',
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build Stage
    const buildProject = new codebuild.PipelineProject(this, 'WavelengthBuild', {
        environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
            computeType: codebuild.ComputeType.SMALL,
            privileged: true, // Only if you need Docker
            environmentVariables: {
                NEXT_PUBLIC_AWS_REGION: { value: this.region },
                NEXT_PUBLIC_USER_POOL_ID: { value: userPool.userPoolId },
                NEXT_PUBLIC_USER_POOL_CLIENT_ID: { value: userPoolClient.userPoolClientId },
                NEXT_PUBLIC_APPSYNC_API_URL: { value: api.graphqlUrl },
                // Your env vars here
                NODE_OPTIONS: { value: "--max-old-space-size=4096" } // Increase memory if needed
            },
          },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm ci'],
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
            ],
          },
        },
        artifacts: {
          'base-directory': 'build',
          files: ['**/*'],
        },
        cache: {
          paths: [
            'node_modules/**/*',
          ],
        },
      }),
    });

    const buildOutput = new codepipeline.Artifact();
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'WavelengthUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'WavelengthUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'GraphQLApiUrl', {
      value: api.graphqlUrl,
      description: 'AppSync GraphQL API URL',
      exportName: 'WavelengthGraphQLApiUrl',
    });

    new cdk.CfnOutput(this, 'GraphQLApiId', {
      value: api.apiId,
      description: 'AppSync GraphQL API ID',
      exportName: 'WavelengthGraphQLApiId',
    });
  }
}