import * as config from "aws-cdk-lib/aws-config";
import * as events from "aws-cdk-lib/aws-events";
import * as eventTargets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { 
    ConfigServiceClient, 
    DescribeConfigurationRecordersCommand, 
    DescribeDeliveryChannelsCommand 
} from "@aws-sdk/client-config-service";


// Enable the AWS Config Managed Rules for EKS Security Best Pratices
export class EksConfigSetup extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        this.buildConfigStack();
    }

    async buildConfigStack() {
        const email = "your-email@example.com";
        const logger = blueprints.utils.logger;
        const currentRegion = process.env.CDK_DEFAULT_REGION!;
        const configclient = new ConfigServiceClient();

        try {
            const command = new DescribeConfigurationRecordersCommand();
            const response = await configclient.send(command);

            if (response.ConfigurationRecorders && response.ConfigurationRecorders.length > 0) {
                logger.info(`AWS Config is already enabled in ${currentRegion} region.`);
            } else {
                logger.info(`AWS Config is not enabled in ${currentRegion} region.`);
                logger.info("Enabling AWS Config...");

                // Create an AWS Config service role
                const awsConfigRole = new iam.Role(this, "RoleAwsConfig", {
                    assumedBy: new iam.ServicePrincipal("config.amazonaws.com"),
                });

                // Attach the service role policy
                awsConfigRole.addManagedPolicy(
                    iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWS_ConfigRole")
                );

                // Check if delivery channel is already enabled
                try {
                    const command = new DescribeDeliveryChannelsCommand();
                    const response = await configclient.send(command);

                    if (response.DeliveryChannels && response.DeliveryChannels.length > 0) {
                        logger.info(`AWS Config delivery channel is already enabled in ${currentRegion} region.`);
                    } else {
                        logger.info(`AWS Config delivery channel is not enabled in ${currentRegion} region.`);
                        logger.info("Configuring AWS Config delivery channel...");
                        
                        // Create an AWS Config delivery channel
                        // Setup an s3 bucket for the config recorder delivery channel
                        const awsConfigBucket = new s3.Bucket(this, "BucketAwsConfig", {
                            versioned: true, enforceSSL: true,
                        });

                        // Configure bucket policy statements and attach them to the s3 bucket
                        this.configureS3BucketPolicy(awsConfigBucket);

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
                        this.configureEventRule(eventRule, configTopic);

                        // Create the AWS Config delivery channel with the s3 bucket and sns topic
                        new config.CfnDeliveryChannel(this, "DeliveryChannel", {
                            name: "default",
                            s3BucketName: awsConfigBucket.bucketName,
                            snsTopicArn: configTopic.topicArn,
                        });
                    }
                } catch (error) {
                    logger.error(error);
                }

                logger.info("Configuring AWS Config recorder...");

                // Create the AWS Config recorder
                new config.CfnConfigurationRecorder(this, "Recorder", {
                    name: "default",
                    roleArn: awsConfigRole.roleArn,
                });
            }
        } catch (error) {
            logger.error(error);
        }
    }

    private configureS3BucketPolicy(awsConfigBucket: s3.Bucket) {
        const policyStatement1 = new iam.PolicyStatement({
            actions: ["s3:*"],
            principals: [new iam.AnyPrincipal()],
            resources: [`${awsConfigBucket.bucketArn}/*`],
            conditions: { Bool: { "aws:SecureTransport": false } },
        });

        policyStatement1.effect = iam.Effect.DENY;
        awsConfigBucket.addToResourcePolicy(policyStatement1);

        const policyStatement2 = new iam.PolicyStatement({
            actions: ["s3:PutObject"],
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
    }

    private configureEventRule(eventRule: events.Rule, configTopic: sns.Topic) {
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
    }
}
