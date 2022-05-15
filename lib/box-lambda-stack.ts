import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Stack, StackProps, CfnParameter, Duration } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_lambda_nodejs as lambda } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_sns as sns } from 'aws-cdk-lib';
import { aws_sns_subscriptions as subscriptions } from 'aws-cdk-lib';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';

interface MyProps extends StackProps {
  defaultRegion: string;
  emailAddress: string;
}

export class DemolambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: MyProps) {
    super(scope, id, props);

    // IAMロール(Lambda用)
    const iamRoleForLambda = new iam.Role(this, 'DemoLambdaRole', {
      roleName: 'SSMSecureStringSampleRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
      ],
    });

    // For DLQ SNS Topic
    const boxTopic = new sns.Topic(this, 'boxTop');
    const emailAddress = new CfnParameter(this, 'demo', {
      type: 'String',
      default: props.emailAddress,
    });
    boxTopic.addSubscription(
      new subscriptions.EmailSubscription(emailAddress.valueAsString)
    );

    const boxUploadLambda = new lambda.NodejsFunction(this, 'NodeLambda', {
      entry: path.join(__dirname, '../lambda/index.ts'),
      environment: { ['DEFAULT_REGION']: props.defaultRegion },
      handler: 'handler',
      timeout: Duration.seconds(20),
      memorySize: 512,
      role: iamRoleForLambda,
      deadLetterTopic: boxTopic,
      // 既存TOPIC を使う場合
      // deadLetterTopic: sns.Topic.fromTopicArn(
      //   this,
      //   'test',
      //   'arn:aws:sns:ap-northeast-1:XXXXXXX:TopicName'
      // ),
    });

    const bucket = new s3.Bucket(this, 'bucektForBox', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    boxUploadLambda.addEventSource(
      new eventsources.S3EventSource(bucket, {
        events: [
          s3.EventType.OBJECT_CREATED_POST,
          s3.EventType.OBJECT_CREATED_PUT,
          s3.EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
        ],
        filters: [{ prefix: 'box/' }], // optional
      })
    );
  }
}
