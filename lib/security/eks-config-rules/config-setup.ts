import * as config from "aws-cdk-lib/aws-config";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";

// Enable the AWS Config Managed Rules for EKS Security Best Pratices
export class EksConfigSetup extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Setup an s3 bucket for the config recorder delivery channel
        const awsConfigBucket = new s3.Bucket(this, "BucketAwsConfig", {
            versioned: true,
        });

        // Configure bucket policy statements and attach them to the s3 bucket
        const policyStatement1 = new iam.PolicyStatement({
            actions: ["s3:*"],
            principals: [new iam.AnyPrincipal()],
            resources: [`${awsConfigBucket.bucketArn}/*`],
            conditions: { Bool: { "aws:SecureTransport": false } },
        });

        policyStatement1.effect = iam.Effect.DENY;
        awsConfigBucket.addToResourcePolicy(policyStatement1);

        const policyStatement2 = new iam.PolicyStatement({
            actions: ["s3:PutObject"],//
        
            principals: [new iam.ServicePrincipal("config.amazonaws.com")],
            resources: [`${awsConfigBucket.bucketArn}/*`],
            conditions: {
                StringEquals: { "s3:x-amz-acl": "bucket-owner-full-control" },
            },
        });

        policyStatement2.effect = iam.Effect.ALLOW;
        awsConfigBucket.addToResourcePolicy(policyStatement2);

        const policyStatement3 = new iam.PolicyStatement({
            actions: ["s3:GetBucketAcl"],
            principals: [new iam.ServicePrincipal("config.amazonaws.com")],
            resources: [awsConfigBucket.bucketArn],
        });

        policyStatement3.effect = iam.Effect.ALLOW;
        awsConfigBucket.addToResourcePolicy(policyStatement3);

        // Create an AWS Config service role
        const awsConfigRole = new iam.Role(this, "RoleAwsConfig", {
            assumedBy: new iam.ServicePrincipal("config.amazonaws.com"),
        });

        // Attach the service role policy
        awsConfigRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWS_ConfigRole")
        );

        // Create the AWS Config delivery channel with the s3 bucket
        new config.CfnDeliveryChannel(this, "DeliveryChannel", {
            s3BucketName: awsConfigBucket.bucketName,
        });

        // Create the AWS Config recorder
        new config.CfnConfigurationRecorder(this, "Recorder", {
            name: "default",
            roleArn: awsConfigRole.roleArn,
        });
    }
}
