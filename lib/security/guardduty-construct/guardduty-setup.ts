import * as aws_guardduty from "aws-cdk-lib/aws-guardduty";
import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as events from "aws-cdk-lib/aws-events";
import * as eventTargets from "aws-cdk-lib/aws-events-targets";
import * as AWS from "aws-sdk";

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

export class GuardDutySetupStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, { ...props, env: { account, region } });

        const environmentName = "main";
        const email = "your-email@example.com";
        const features: aws_guardduty.CfnDetector.CFNFeatureConfigurationProperty[] =
      [
          { name: "S3_DATA_EVENTS", status: "ENABLED" },
          { name: "EKS_AUDIT_LOGS", status: "ENABLED" },
          { name: "EBS_MALWARE_PROTECTION", status: "ENABLED" },
          { name: "RDS_LOGIN_EVENTS", status: "ENABLED" },
          { name: "LAMBDA_NETWORK_LOGS", status: "ENABLED" },
          { 
              name: "RUNTIME_MONITORING",
              status: "ENABLED",
              additionalConfiguration: [
                  { name: "EKS_ADDON_MANAGEMENT", status: "ENABLED" },
                  { name: "ECS_FARGATE_AGENT_MANAGEMENT", status: "ENABLED" },
                  { name: "EC2_AGENT_MANAGEMENT", status: "ENABLED" },
              ],
          },
      ];

        // check if GuardDuty is already enabled in the region
        const guardDuty = new AWS.GuardDuty();
        guardDuty.listDetectors({}, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            } else {
                if (data.DetectorIds?.length === 0) {
                    // Create a GuardDuty detector
                    new aws_guardduty.CfnDetector(this, id + "GuardDutyDetector", {
                        enable: true,
                        features,
                    });

                    // Configure GuardDuty to email any security findings
                    const guardDutyTopic = new sns.Topic(
                        this,
                        id + "GuardDutyNotificationTopic"
                    );
                    guardDutyTopic.addSubscription(new subs.EmailSubscription(email));
                    const eventRule = new events.Rule(this, id + "GuardDutyEventRule", {
                        eventPattern: {
                            source: ["aws.guardduty"],
                            detailType: ["GuardDuty Finding"],
                        },
                    });

                    // Format the GuardDuty findings emails
                    eventRule.addTarget(
                        new eventTargets.SnsTopic(guardDutyTopic, {
                            message: events.RuleTargetInput.fromText(
                                `WARNING: AWS GuardDuty has discovered a ${events.EventField.fromPath(
                                    "$.detail.type"
                                )} security issue for ${environmentName} (${events.EventField.fromPath(
                                    "$.region"
                                )}). Please go to https://${events.EventField.fromPath(
                                    "$.region"
                                )}.console.aws.amazon.com/guardduty/ to find out more details.`
                            ),
                        })
                    );
                    return;
                } else {
                    console.log("GuardDuty is enabled in this region.");
                }

                // Update the existing detector to use the EKS features
                console.log("Updating the detector to make sure EKS features are enabled.");
                const detectorId = data.DetectorIds[0];
                console.log("Detector ID: " + detectorId);
                const params: AWS.GuardDuty.UpdateDetectorRequest = {
                    DetectorId: detectorId,
                    Features: [
                        {
                            AdditionalConfiguration: [
                                {
                                    Name: "EKS_ADDON_MANAGEMENT",
                                    Status: "ENABLED",
                                },
                            ],
                            Name: "RUNTIME_MONITORING",
                            Status: "ENABLED",
                        },
                        {
                            Name: "EKS_AUDIT_LOGS",
                            Status: "ENABLED",
                        },
                    ]
                };
                guardDuty.updateDetector(params, (err, data) => {
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        console.log("Updated GuardDuty detector with EKS features.");
                    }
                });
            }
        });
    }
}
