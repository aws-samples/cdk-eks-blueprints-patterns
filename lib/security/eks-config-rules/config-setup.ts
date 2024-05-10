import * as config from "aws-cdk-lib/aws-config";
import * as events from "aws-cdk-lib/aws-events";
import * as eventTargets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import * as AWS from "aws-sdk";

// Enable the AWS Config Managed Rules for EKS Security Best Pratices
export class EksConfigSetup extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const email = "your-email@example.com";

        // Check if AWS Config is already enabled in the region
        const awsConfig = new AWS.ConfigService();
        awsConfig.describeConfigurationRecorders({}, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            } else {
                if (data.ConfigurationRecorders?.length === 0) {
                    console.log("AWS Config is not enabled in this region.");
                    console.log("Enabling AWS Config...");

                    // Create an AWS Config service role
                    const awsConfigRole = new iam.Role(this, "RoleAwsConfig", {
                        assumedBy: new iam.ServicePrincipal("config.amazonaws.com"),
                    });

                    // Attach the service role policy
                    awsConfigRole.addManagedPolicy(
                        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWS_ConfigRole")
                    );

                    // Check if delivery channel is already enabled
                    awsConfig.describeDeliveryChannels({}, (err, data) => {
                        if (err) {
                            console.log(err, err.stack);
                        } else {
                            if (data.DeliveryChannels?.length === 0) {
                                console.log("AWS Config delivery channel is not enabled in this region.");
                                // Setup an s3 bucket for the config recorder delivery channel
                                const awsConfigBucket = new s3.Bucket(this, "BucketAwsConfig", {
                                    versioned: true, enforceSSL: true,
                                });

                                // Configure bucket policy statements and attach them to the s3 bucket
                                const policyStatement1 = new iam.PolicyStatement({
                                    actions: ["s3:*"],
                                    principals: [new iam.AnyPrincipal()],
                                    resources: [`${awsConfigBucket.bucketArn}/*`],
                                    conditions: { Bool: { "aws:SecureTransport": false } },
                                });

                                // Create an SNS topic for AWS Config notifications
                                const configTopic = new sns.Topic(this, "ConfigNotificationTopic");
                                configTopic.addSubscription(new subs.EmailSubscription(email));
                                const eventRule = new events.Rule(this, "ConfigEventRule", {
                                    eventPattern: {
                                        source: ["aws.config"],
                                        detailType: ["Config Rules Compliance Change"],
                                    },
                                });

                                // Format the Config notifications
                                eventRule.addTarget(
                                    new eventTargets.SnsTopic(configTopic, {
                                        message: events.RuleTargetInput.fromText(
                                            `WARNING: AWS Config has detected a ${events.EventField.fromPath(
                                                "$.detail.newEvaluationResult.complianceType"
                                            )} for the rule ${events.EventField.fromPath(
                                                "$.detail.configRuleName"
                                            )}. The compliance status is ${events.EventField.fromPath(
                                                "$.detail.newEvaluationResult.evaluationResult"
                                            )}.`
                                        ),
                                    })
                                );

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

                                // Create the AWS Config delivery channel with the s3 bucket and sns topic
                                new config.CfnDeliveryChannel(this, "DeliveryChannel", {
                                    name: "default",
                                    s3BucketName: awsConfigBucket.bucketName,
                                    snsTopicArn: configTopic.topicArn,
                                });
                            } else {
                                console.log("AWS Config delivery channel is already enabled in this region.");
                            }
                        }
                    });

                    // Create the AWS Config recorder
                    new config.CfnConfigurationRecorder(this, "Recorder", {
                        name: "default",
                        roleArn: awsConfigRole.roleArn,
                    });
                } else {
                    console.log("AWS Config is already enabled in this region.");
                }
            }
        });
    }
}
