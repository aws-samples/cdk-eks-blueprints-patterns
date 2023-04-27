import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import { aws_config as config } from 'aws-cdk-lib';
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";


export class SecurityHubStackSetup extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for storing AWS Config data
    const configBucket = new s3.Bucket(this, "ConfigBucket", {
      versioned: true,
    });

    // Enable AWS Config
    const configRecorder = new config.CfnConfigurationRecorder(this, "ConfigRecorder", {
      name: "YourConfigRecorder",
      roleArn: `arn:aws:iam::${process.env.CDK_ACCOUNT_ID!}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig`,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create an AWS Config delivery channel
    const deliveryChannel = new config.CfnDeliveryChannel(this, "ConfigDeliveryChannel", {
      name: "YourDeliveryChannel",
      s3BucketName: configBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: "TwentyFour_Hours",
      },
    });

    // Add a dependency to ensure the Config Recorder is created before the Delivery Channel
    deliveryChannel.node.addDependency(configRecorder);
  }
}
